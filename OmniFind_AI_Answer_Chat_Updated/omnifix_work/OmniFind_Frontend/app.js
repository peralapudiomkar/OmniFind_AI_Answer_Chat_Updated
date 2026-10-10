(() => {
  const $ = s => document.querySelector(s);
  const state = {category:"all", mode:"hybrid", query:"", results:[], coords:null};
  const names = {all:"All knowledge",documents:"Documents",images:"Images",products:"Products",code:"Code",audio:"Audio",education:"Education",web:"Web",science:"Science",places:"Places"};
  const safe = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const chatState = {history:[], busy:false};
  function chatText(text) {
    return safe(text).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      .replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\n/g,"<br>");
  }
  function addChatMessage(role, text, sources=[]) {
    const messages=$("#aiChatMessages");
    messages.querySelector(".ai-chat-welcome")?.remove();
    const row=document.createElement("article");
    row.className=`ai-message ${role==="user"?"ai-message-user":"ai-message-assistant"}`;
    row.innerHTML=`<div class="ai-message-label">${role==="user"?"You":"✦ OmniFind AI"}</div><div class="ai-message-body">${chatText(text)}</div>`;
    if(sources.length){
      const list=document.createElement("div"); list.className="ai-source-list";
      list.innerHTML=`<div class="ai-source-heading">Sources retrieved for this answer</div>`+sources.map(src=>
        `<a class="ai-source-link" href="${safe(src.url)}" target="_blank" rel="noopener noreferrer"><span class="ai-source-number">[${Number(src.number)}]</span><span><strong>${safe(src.title)}</strong><small>${safe(src.source||src.category||"Public API")}</small></span><span class="ai-source-open">↗</span></a>`
      ).join("");
      row.appendChild(list);
    }
    messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
    return row;
  }
  async function sendAiMessage(text) {
    const question=String(text||"").trim();
    if(!question||chatState.busy)return;
    $("#aiChatMessages")?.querySelector(".ai-chat-welcome")?.remove();
    addChatMessage("user",question);
    const previous=chatState.history.slice(-8);
    chatState.history.push({role:"user",content:question});
    chatState.busy=true;
    const send=$("#aiChatSendBtn"), input=$("#aiChatInput");
    send.disabled=true; send.innerHTML='<span class="ai-spinner"></span> Thinking';
    input.disabled=true;
    const pending=addChatMessage("assistant","Searching live sources and preparing an answer…");
    pending.classList.add("ai-message-pending");
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:question,history:previous,category:state.category})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"AI chat request failed.");
      pending.remove();
      addChatMessage("assistant",data.answer||"The AI provider returned an empty answer.",data.sources||[]);
      chatState.history.push({role:"assistant",content:data.answer||""});
      if(data.retrieval==="no matching live source records") addChatMessage("assistant","Note: no matching live source records were found, so the answer may rely more on general model knowledge.");
      if(data.api_warnings?.length) addChatMessage("assistant",`Some live sources were unavailable: ${data.api_warnings.join(", ")}. Results may be incomplete.`);
    }catch(error){
      pending.remove(); addChatMessage("assistant",`I couldn't answer that request. ${error.message}`);
    }finally{
      chatState.busy=false; send.disabled=false; send.innerHTML='<span>Send</span> <span aria-hidden="true">➤</span>'; input.disabled=false; input.focus();
    }
  }
  function openAiChat(){
    $("#aiChatModal")?.classList.remove("hidden");
    setTimeout(()=>$("#aiChatInput")?.focus(),30);
  }
  async function search() {
    const q=$("#searchInput").value.trim(); state.query=q;
    // Place searches use the live geocoding API, then open Google Maps directions.
    // Select the Places / GPS category first to use this direct-navigation behavior.
    if (state.category === "places" && q) {
      const submit = $(".search-submit-btn");
      if (submit) { submit.disabled = true; submit.querySelector("span").textContent = "Finding place…"; }
      $("#resultsTitle").textContent = `Finding “${q}”`;
      $("#resultsSubtitle").textContent = "Looking up this place using live geocoding data…";
      $("#resultsGrid").innerHTML = '<div class="empty-state">Finding the place…</div>';
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Place lookup failed");
        if (!data.results || !data.results.length) throw new Error("No matching place found. Try a more specific name or address.");
        const place = data.results[0];
        const destination = `${place.lat},${place.lon}`;
        const route = new URL("https://www.google.com/maps/dir/");
        route.searchParams.set("api", "1");
        route.searchParams.set("destination", destination);
        route.searchParams.set("travelmode", "driving");
        if (state.coords) route.searchParams.set("origin", `${state.coords.lat},${state.coords.lon}`);
        // Navigate in the same tab so browsers do not block it as a popup.
        window.location.assign(route.toString());
        return;
      } catch (error) {
        $("#resultsSubtitle").textContent = "Place lookup failed";
        $("#resultsGrid").innerHTML = `<div class="empty-state"><h3>Could not find directions</h3><p>${safe(error.message)}</p><p>Check that the Flask backend is running and try again.</p></div>`;
        if (submit) { submit.disabled = false; submit.querySelector("span").textContent = "Search"; }
        return;
      }
    }
    $("#resultsTitle").textContent=q?`Results for “${q}”`:"Explore live public sources";
    $("#resultsSubtitle").textContent="Fetching data from public APIs…";
    $("#resultsGrid").innerHTML='<div class="empty-state">Loading live search results…</div>';
    const started=performance.now();
    try {
      const p=new URLSearchParams({q,category:state.category,limit:30,mode:state.mode,alpha:$("#alphaRange")?.value||.7});
      if(state.coords && state.category==="places"){p.set("lat",state.coords.lat);p.set("lon",state.coords.lon);}
      const r=await fetch(`/api/search?${p}`); const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Search failed");
      state.results=data.results||[];
      $("#resultCountBadge").textContent=`${state.results.length} results`;
      $("#latencyBadge").textContent=`${Math.round(performance.now()-started)} ms`;
      $("#engineModeBadge").textContent=state.mode==="hybrid"?"Hybrid ranking":state.mode==="vector"?"Vector-like ranking":"Keyword ranking";
      const errs=Object.keys(data.errors||{});
      $("#resultsSubtitle").textContent=errs.length?`Some APIs did not respond: ${errs.join(", ")}. Public APIs may rate-limit requests.`:`Live public API results. ${data.sources||""}.`;
      render(state.results);
      const counts={all:state.results.length}; state.results.forEach(x=>counts[x.category]=(counts[x.category]||0)+1);
      for(const [k,id] of Object.entries({all:"countAll",documents:"countDocs",images:"countImages",products:"countProducts",code:"countCode",audio:"countAudio",education:"countEdu"})) if($("#"+id)) $("#"+id).textContent=counts[k]||0;
      if($("#clearSearchBtn")) $("#clearSearchBtn").classList.toggle("hidden",!q);
    } catch(e) {
      $("#resultsSubtitle").textContent="Backend/API error";
      $("#resultsGrid").innerHTML=`<div class="empty-state"><h3>Could not complete search</h3><p>${safe(e.message)}</p><p>Start locally with <code>python app.py</code>, then open <code>http://localhost:5000</code>.</p></div>`;
    }
  }
  function render(items) {
    let exportBar = document.getElementById("exportResultsBar");
    if (!exportBar) { exportBar=document.createElement("div"); exportBar.id="exportResultsBar"; exportBar.className="export-results-bar"; const grid=$("#resultsGrid"); grid.parentNode.insertBefore(exportBar,grid); }
    exportBar.innerHTML = `<span>Export results (${items.length})</span><button type="button" id="downloadJsonBtn" class="nav-btn-secondary">Download JSON</button><button type="button" id="downloadCsvBtn" class="nav-btn-secondary">Download CSV</button>`;
    const download=(type)=>{const rows=state.results;let content,mime,ext;if(type==="json"){content=JSON.stringify(rows.map(({vector,...x})=>x),null,2);mime="application/json";ext="json";}else{const cols=["title","category","description","url","source","score","lat","lon"];const cell=v=>'"'+String(v??"").replace(/"/g,'""').replace(/[\r\n]+/g,' ')+'"';content=[cols.join(","),...rows.map(x=>cols.map(k=>cell(x[k])).join(","))].join("\r\n");mime="text/csv;charset=utf-8";ext="csv";}const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`omnifind-results-${new Date().toISOString().slice(0,10)}.${ext}`;a.click();URL.revokeObjectURL(url);};
    $("#downloadJsonBtn").onclick=()=>download("json");$("#downloadCsvBtn").onclick=()=>download("csv");
    if(!items.length){$("#resultsGrid").innerHTML='<div class="empty-state"><div class="empty-icon">⌕</div><h3>No results found</h3><p>Try another phrase or category. If an API failed, try again later.</p></div>';return;}
    $("#resultsGrid").innerHTML=items.map(x=>`<article class="result-card">
      <div class="card-top"><span class="card-badge">${safe(names[x.category]||x.category)}</span><span class="card-tags">${safe(x.meta||x.source||"Public source")}</span></div>
      ${x.image?`<a href="${safe(x.url)}" target="_blank" rel="noopener"><img class="card-media-preview" loading="lazy" src="${safe(x.image)}" alt="${safe(x.title)}" onerror="this.style.display='none'"></a>`:""}
      <h3 class="card-title">${safe(x.title)}</h3><p class="card-description">${safe(x.description||"No description provided by source.")}</p>
      <div class="card-bottom"><span>Match ${(Number(x.score||0)*100).toFixed(1)}%</span>
      ${x.url?`<a class="nav-btn-secondary" href="${safe(x.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`:""}
      ${x.preview_url?`<audio controls preload="none" src="${safe(x.preview_url)}">Audio preview unavailable</audio>`:""}
      ${x.lat!=null&&x.lon!=null?`<a class="nav-btn-secondary" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${x.lat},${x.lon}`)}${state.coords?`&origin=${encodeURIComponent(`${state.coords.lat},${state.coords.lon}`)}`:""}&travelmode=driving">Google Maps directions ↗</a>`:""}
      </div></article>`).join("");
  }
  async function loadGraph() {
    try { const d=await (await fetch("/api/graph")).json();
      for(const [id,val] of Object.entries({statNodes:d.nodes,statTotalEdges:d.edges,statMaxLevel:Math.max(0,...(d.layers||[0])),statM:d.M,statEfCons:d.efConstruction,statEfSearch:d.efSearch,statMl:"1 / ln(M)",statWasmMem:d.backend,statActiveMetric:$("#metricSelect")?.value||"cosine"})) if($("#"+id)) $("#"+id).textContent=val;
    } catch(e) { $("#statNodes").textContent="Unavailable"; }
  }
  function modal(id, open) { const el=$("#"+id); if(el) el.classList.toggle("hidden",!open); }
  async function upload(files) {
    if(!files || !files.length) return;
    $("#ingestStatus").classList.remove("hidden"); $("#ingestStatus").textContent="Uploading and indexing…";
    for(const f of files) {
      const fd=new FormData(); fd.append("file",f);
      try { const r=await fetch("/api/ingest",{method:"POST",body:fd}); const d=await r.json();
        if(!r.ok) throw new Error(d.error||"Upload failed");
        $("#ingestStatus").textContent=`${f.name}: indexed ${d.dimension}-dimension vector. ${d.note||""}`;
      } catch(e) { $("#ingestStatus").textContent=`${f.name}: ${e.message}`; }
    }
    loadGraph();
  }
  function updatePlaceControls(){const isPlaces=state.category==="places";["useLocationBtn"].forEach(id=>{const b=$("#"+id);if(b)b.classList.toggle("hidden",!isPlaces);});const searchInput=$("#searchInput");if(searchInput)searchInput.placeholder=isPlaces?"Find a place, address, school, hospital, shop…":"Search documents, research, products, code, music and more…";}
  document.addEventListener("DOMContentLoaded",async()=>{
    $("#openAiChatBtn")?.addEventListener("click",openAiChat);
    $("#closeAiChatBtn")?.addEventListener("click",()=>$("#aiChatModal")?.classList.add("hidden"));
    $("#aiChatModal")?.addEventListener("click",e=>{if(e.target===$("#aiChatModal"))$("#aiChatModal").classList.add("hidden");});
    $("#aiChatForm")?.addEventListener("submit",e=>{e.preventDefault();const input=$("#aiChatInput");const value=input.value.trim();if(value){input.value="";sendAiMessage(value);}});
    $("#aiChatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#aiChatForm")?.requestSubmit();}});
    document.querySelectorAll(".ai-suggestion").forEach(b=>b.addEventListener("click",()=>sendAiMessage(b.dataset.aiPrompt||b.textContent)));

    try { const auth=await fetch("/api/auth/me").then(r=>r.json()); if(!auth.authenticated){location.href="/login";return;} const nav=document.querySelector(".nav-links"); if(nav&&!$("#logoutBtn")){const b=document.createElement("button");b.id="logoutBtn";b.type="button";b.className="nav-btn-secondary";b.textContent="Log out";b.title=auth.email||"Log out";b.onclick=async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"};nav.appendChild(b);} } catch(e) { location.href="/login";return; }
    updatePlaceControls();

    $("#searchForm")?.addEventListener("submit",e=>{e.preventDefault();search();});
    $("#clearSearchBtn")?.addEventListener("click",()=>{$("#searchInput").value="";search();});
    $("#categoryChips")?.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.category=b.dataset.category;updatePlaceControls();$("#categoryChips").querySelectorAll("[data-category]").forEach(n=>n.classList.toggle("active",n===b));search();});
    $("#searchModeGroup")?.addEventListener("click",e=>{const b=e.target.closest("[data-mode]");if(!b)return;state.mode=b.dataset.mode;$("#searchModeGroup").querySelectorAll("[data-mode]").forEach(n=>n.classList.toggle("active",n===b));search();});
    document.querySelectorAll(".shortcut-tag").forEach(b=>b.addEventListener("click",()=>{$("#searchInput").value=b.dataset.query||b.textContent.trim();search();}));
    $("#toggleControlsBtn")?.addEventListener("click",()=>{$("#controlsDrawer").classList.toggle("hidden");$("#controlsArrow").textContent=$("#controlsDrawer").classList.contains("hidden")?"▼":"▲";});
    $("#themeToggle")?.addEventListener("click",()=>{document.body.classList.toggle("dark");$("#themeToggle").textContent=document.body.classList.contains("dark")?"☀":"☾";});
    $("#resetSearchBtn")?.addEventListener("click",()=>{$("#searchInput").value="";state.category="all";state.coords=null;updatePlaceControls();document.querySelectorAll("[data-category]").forEach(n=>n.classList.toggle("active",n.dataset.category==="all"));search();});
    $("#openHnswModalBtn")?.addEventListener("click",()=>{modal("hnswModal",true);loadGraph();});
    $("#closeHnswModalBtn")?.addEventListener("click",()=>modal("hnswModal",false));
    $("#closeHnswModalBtn2")?.addEventListener("click",()=>modal("hnswModal",false));
    $("#openIngestModalBtn")?.addEventListener("click",()=>modal("ingestModal",true));
    $("#closeIngestModalBtn")?.addEventListener("click",()=>modal("ingestModal",false));
    $("#closeDetailModalBtn")?.addEventListener("click",()=>modal("detailModal",false));
    $("#rebuildHnswBtn")?.addEventListener("click",async()=>{const b=$("#rebuildHnswBtn");b.disabled=true;b.textContent="Refreshing…";await search();await loadGraph();b.disabled=false;b.textContent="Rebuild / Refresh Index";});
    $("#browseFilesBtn")?.addEventListener("click",()=>$("#fileInput")?.click());
    $("#fileInput")?.addEventListener("change",e=>upload(e.target.files));
    $("#dropzone")?.addEventListener("dragover",e=>{e.preventDefault();e.currentTarget.classList.add("dragover");});
    $("#dropzone")?.addEventListener("dragleave",e=>e.currentTarget.classList.remove("dragover"));
    $("#dropzone")?.addEventListener("drop",e=>{e.preventDefault();e.currentTarget.classList.remove("dragover");upload(e.dataTransfer.files);});
    $("#useLocationBtn")?.addEventListener("click",()=>{
      if(!navigator.geolocation){alert("This browser does not support GPS location.");return;}
      const b=$("#useLocationBtn");b.disabled=true;b.textContent="Getting location…";
      navigator.geolocation.getCurrentPosition(pos=>{
        state.coords={lat:pos.coords.latitude,lon:pos.coords.longitude};state.category="places";updatePlaceControls();
        $("#searchInput").placeholder="Search nearby places…";$("#searchInput").value=$("#searchInput").value||"";
        document.querySelectorAll("[data-category]").forEach(n=>n.classList.toggle("active",n.dataset.category==="places"));
        b.disabled=false;b.textContent="📍 Location enabled";search();
      },err=>{b.disabled=false;b.textContent="📍 Use my location";alert("Location permission failed or unavailable. Allow location in browser settings and use HTTPS or localhost.");},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
    });
    ["kCountRange","efSearchRange","alphaRange","metricSelect"].forEach(id=>$("#"+id)?.addEventListener("change",()=>{
      if(id==="kCountRange") $("#kCountValue").textContent=$("#kCountRange").value;
      if(id==="efSearchRange") $("#efSearchValue").textContent=$("#efSearchRange").value;
      if(id==="alphaRange") $("#alphaValue").textContent=`${Math.round(Number($("#alphaRange").value)*100)}% Vector / ${100-Math.round(Number($("#alphaRange").value)*100)}% Keyword`;
      search();
    }));
    document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden");}));
    fetch("/api/health").then(r=>r.json()).then(d=>{if($("#wasmBadgeText"))$("#wasmBadgeText").textContent=d.ann_backend;}).catch(()=>{});
    search();
  });
})();