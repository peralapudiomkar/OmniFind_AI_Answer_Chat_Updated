/**
 * OmniFind Large Universal Search Collection Dataset
 * Contains rich multi-modal items across 6 domain categories:
 * - documents: PDF papers, text files, contracts, manuals
 * - images: High-res photos, UI mockups, infographics, visual assets
 * - products: Electronics, gadgets, office gear, audio equipment
 * - code: Python, JavaScript, Rust, C++, SQL code snippets
 * - audio: Music tracks, podcasts, ambient sounds, audiobooks
 * - education: Math, physics, biology, history, computer science lessons
 */

// Helper to normalize a vector
function normalizeVector(vec) {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vec;
  return vec.map(v => v / norm);
}

// Deterministic vector generator based on content seed words for 32 dimensions
function generateSemanticVector(category, text, tags) {
  const dim = 32;
  const vec = new Array(dim).fill(0.01);
  const combined = (text + " " + tags).toLowerCase();
  
  // Base category bias to cluster domain vectors naturally
  const categoryBias = {
    documents: [0.8, 0.2, 0.1, 0.0, 0.1, 0.3, 0.4, 0.1],
    images:    [0.1, 0.9, 0.2, 0.1, 0.0, 0.1, 0.2, 0.5],
    products:  [0.1, 0.2, 0.9, 0.3, 0.1, 0.1, 0.0, 0.2],
    code:      [0.2, 0.1, 0.2, 0.9, 0.5, 0.2, 0.1, 0.0],
    audio:     [0.0, 0.2, 0.3, 0.1, 0.9, 0.1, 0.2, 0.4],
    education: [0.5, 0.1, 0.1, 0.3, 0.1, 0.9, 0.3, 0.1]
  };
  
  const bias = categoryBias[category] || new Array(8).fill(0.1);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 4; j++) {
      vec[i * 4 + j] += bias[i] * 0.5;
    }
  }

  // Hash words to vector dimensions deterministically
  const words = combined.split(/\W+/).filter(w => w.length > 2);
  words.forEach(w => {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash << 5) - hash + w.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    const val = ((hash % 100) / 100.0);
    vec[idx] += val;
  });

  return normalizeVector(vec);
}

const rawCatalog = [
  // ==================== DOCUMENTS & PDFs ====================
  {
    id: 101,
    title: "Deep Neural Network Architecture & Optimization.pdf",
    category: "documents",
    subType: "PDF Document",
    icon: "📄",
    description: "Comprehensive research paper on backpropagation dynamics, transformer attention mechanisms, and stochastic gradient descent optimization.",
    content: "Deep Neural Networks have revolutionized machine learning. This document outlines residual connections, learning rate schedulers, AdamW optimizers, and gradient clipping for large language models.",
    meta: "PDF · 18 Pages · 4.2 MB",
    tags: "pdf machine learning deep neural network gradient descent optimizer transformer python paper research",
    url: "#",
    author: "Dr. Elena Rostova",
    date: "2025-11-14",
    highlights: ["Residual Skip Connections", "Multi-Head Attention", "Cosine Annealing"]
  },
  {
    id: 102,
    title: "Quarterly Financial Analysis & Revenue Forecast Q4.pdf",
    category: "documents",
    subType: "PDF Report",
    icon: "📊",
    description: "Detailed financial breakdown including EBITDA margins, operating expenses, ARR trajectory, and enterprise SaaS valuation metrics.",
    content: "Q4 financial results demonstrate a 34% YoY increase in Annual Recurring Revenue (ARR). Gross margin expanded to 82% driven by cloud infrastructure optimizations and enterprise contract renewals.",
    meta: "PDF · 32 Pages · 8.1 MB",
    tags: "pdf financial report revenue balance sheet ebitda SaaS earnings quarter metrics business",
    url: "#",
    author: "Finance Operations Team",
    date: "2026-01-10",
    highlights: ["34% ARR Growth", "82% Gross Margin", "Cash Flow Positive"]
  },
  {
    id: 103,
    title: "Enterprise Cybersecurity Compliance & Zero-Trust Protocol.docx",
    category: "documents",
    subType: "DOCX Policy",
    icon: "🛡️",
    description: "Official security framework detailing ISO-27001 policies, OAuth2 RBAC authorization, and automated vulnerability scanning guidelines.",
    content: "Zero-Trust Security Architecture dictates strict identity verification for every user and service request. Endpoint detection, TLS 1.3 encryption, and periodic penetration testing are mandatory.",
    meta: "DOCX · 24 Pages · 1.5 MB",
    tags: "security zero trust iso27001 cybersecurity compliance oauth rbac encryption privacy audit policy document",
    url: "#",
    author: "Chief Information Security Officer",
    date: "2025-09-22",
    highlights: ["TLS 1.3 Enforced", "Role-Based Access Control", "Automated Threat Detection"]
  },
  {
    id: 104,
    title: "Clinical Trial Results for Novel Cardiovascular Therapy.pdf",
    category: "documents",
    subType: "PDF Medical Journal",
    icon: "🩺",
    description: "Phase III double-blind clinical trial findings evaluating drug efficacy, patient biomarkers, and statistical p-value metrics.",
    content: "Phase III trial data indicates a 42% reduction in major adverse cardiac events among treatment cohort over 24 months. Biomarker panel confirmed significant reduction in arterial inflammation.",
    meta: "PDF · 45 Pages · 12.0 MB",
    tags: "pdf medical clinical trial cardiology paper health research biology pharmacology p-value statistics",
    url: "#",
    author: "Journal of Medicine & Bio-Science",
    date: "2025-12-05",
    highlights: ["42% Risk Reduction", "p < 0.001 Significance", "2,400 Patient Cohort"]
  },
  {
    id: 105,
    title: "Distributed Database Systems & Consensus Algorithms.pdf",
    category: "documents",
    subType: "PDF Computer Science",
    icon: "💾",
    description: "Technical treatise exploring Raft and Paxos consensus, distributed transactions, multi-master replication, and ACID guarantees.",
    content: "Designing fault-tolerant distributed databases requires consensus protocols. This paper compares Raft log replication with Multi-Paxos under high network partition latency.",
    meta: "PDF · 28 Pages · 3.8 MB",
    tags: "pdf database raft paxos consensus distributed systems concurrency transactions architecture paper",
    url: "#",
    author: "Prof. Marcus Thorne",
    date: "2025-08-19",
    highlights: ["Raft Protocol Details", "Split-Brain Prevention", "Linearizable Consistency"]
  },
  {
    id: 106,
    title: "Renewable Energy Grid Integration & Storage Whitepaper.pdf",
    category: "documents",
    subType: "PDF Whitepaper",
    icon: "🌱",
    description: "Comprehensive guide to lithium-iron phosphate battery storage systems, solar microgrids, and smart grid load balancing.",
    content: "Transitioning electrical grids to 100% renewable power necessitates utility-scale energy storage. Battery management systems (BMS) dynamically absorb peak solar production.",
    meta: "PDF · 50 Pages · 9.4 MB",
    tags: "pdf renewable energy solar power battery grid climate green technology whitepaper sustainability",
    url: "#",
    author: "Clean Energy Advisory Board",
    date: "2026-02-01",
    highlights: ["BMS Storage Tech", "Peak Shaving", "Microgrid Resilience"]
  },
  {
    id: 107,
    title: "Legal Contract & Master Services Agreement Template.pdf",
    category: "documents",
    subType: "PDF Legal",
    icon: "⚖️",
    description: "Standard corporate MSA legal agreement clause clauses indemnification, IP ownership, liability caps, and arbitration rules.",
    content: "Master Services Agreement between Client and Vendor defining deliverables, intellectual property assignments, confidentiality covenants, and limitation of liability clauses.",
    meta: "PDF · 16 Pages · 1.1 MB",
    tags: "pdf legal contract agreement corporate law intellectual property liability msa document",
    url: "#",
    author: "Corporate Legal Counsel",
    date: "2025-07-30",
    highlights: ["IP Assignment Clause", "Indemnification Caps", "Dispute Resolution"]
  },

  // ==================== IMAGES ====================
  {
    id: 201,
    title: "Futuristic Cyberpunk Neon Metropolis",
    category: "images",
    subType: "Digital Artwork",
    icon: "🖼️",
    description: "High-resolution digital illustration of glowing skyscraper neon lights, rainy reflection streets, and futuristic flying vehicles.",
    content: "Visually vivid cyberpunk city scene with deep indigo, purple, and electric cyan neon light glows reflecting off wet asphalt in a foggy night rain.",
    meta: "3840 x 2160 · PNG · 14.5 MB",
    tags: "image photography cyberpunk city lights neon futuristic wallpaper digital art sci-fi dark purple cyan blue",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    author: "Visual Art Studio",
    colors: ["#6558e8", "#00d2ff", "#ff007f", "#0d0e15"]
  },
  {
    id: 202,
    title: "Alpine Lake Reflection at Golden Hour",
    category: "images",
    subType: "Landscape Photo",
    icon: "🏔️",
    description: "Breathtaking landscape photography featuring snow-capped mountain peaks mirrored in a pristine turquoise alpine glacier lake.",
    content: "Serene nature photography capturing golden hour sunrise over jagged granite mountain ridges with smooth glass reflection water.",
    meta: "6000 x 4000 · RAW / JPG · 18.2 MB",
    tags: "image photography mountain lake landscape nature scenery travel alpine reflection sunset golden hour sky green blue water",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    author: "Nature Lens Collective",
    colors: ["#2d6a4f", "#74c69d", "#ffb703", "#1d3557"]
  },
  {
    id: 203,
    title: "Modern Glassmorphism UI Design Dashboard System",
    category: "images",
    subType: "UI/UX Mockup",
    icon: "🎨",
    description: "Sleek web dashboard user interface template featuring frosted glass cards, vibrant chart gradients, and clean dark mode typography.",
    content: "UI design wireframe with analytics graphs, interactive widgets, toggle switches, user profile avatars, and clean modern layout aesthetics.",
    meta: "2560 x 1600 · SVG / Figma · 4.8 MB",
    tags: "image ui ux design dashboard glassmorphism web app template user interface graphic mockup typography dark mode",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    author: "UX Foundry",
    colors: ["#191b28", "#6558e8", "#36bd8b", "#ffffff"]
  },
  {
    id: 204,
    title: "Minimalist Architectural Concrete & Glass Villa",
    category: "images",
    subType: "Architecture Photography",
    icon: "🏛️",
    description: "Architectural photo showcasing warm ambient lighting, smooth raw concrete walls, cantilevered overhangs, and floor-to-ceiling glass.",
    content: "Modern architectural exterior design with minimalist geometric lines, natural wood accents, warm lighting, and surrounding garden landscape.",
    meta: "4500 x 3000 · JPG · 11.4 MB",
    tags: "image architecture design house modern minimal interior concrete home interior villa light space photo",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    author: "ArchDigest Photo",
    colors: ["#d8d4cd", "#4a4e69", "#f2e9e4", "#22223b"]
  },
  {
    id: 205,
    title: "Macro Shot of Microchip Circuit & Semiconductor Die",
    category: "images",
    subType: "Macro Tech Photo",
    icon: "🔬",
    description: "Close-up macro photography revealing microscopic silicon wafer etchings, gold bonding wires, and integrated circuit transistors.",
    content: "Detailed macro photo of a high-performance CPU processor silicon die under blue ultraviolet laboratory illumination.",
    meta: "5120 x 3413 · PNG · 22.0 MB",
    tags: "image macro tech microchip silicon circuit processor cpu hardware technology science hardware electronics",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    author: "Silicon Lab Imagery",
    colors: ["#0077b6", "#03045e", "#90e0ef", "#000000"]
  },
  {
    id: 206,
    title: "Infographic: Renewable Energy Global Transition",
    category: "images",
    subType: "Infographic Graphic",
    icon: "📈",
    description: "Clean vector data graphic displaying pie charts, energy consumption bar graphs, global wind/solar output maps, and statistics.",
    content: "Vector infographic illustration detailing solar panel conversion efficiency rates, battery storage gigawatt hours, and carbon emission targets.",
    meta: "3000 x 5000 · Vector SVG · 2.1 MB",
    tags: "image infographic vector data charts statistics graph solar wind energy climate graphic green",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    author: "EcoData Visuals",
    colors: ["#2a9d8f", "#e76f51", "#f4a261", "#264653"]
  },

  // ==================== PRODUCTS ====================
  {
    id: 301,
    title: "ApexPro Active Noise-Canceling Wireless Headphones",
    category: "products",
    subType: "Audio Hardware",
    icon: "🎧",
    description: "Premium over-ear wireless headphones featuring custom 40mm titanium drivers, 40-hour battery life, spatial 3D audio, and Bluetooth 5.3.",
    content: "Unmatched acoustic clarity with hybrid active noise cancellation (ANC), memory foam earcups, multi-point connectivity, and lossless LDAC audio streaming.",
    meta: "$299.99 · ★ 4.9 (1,420 reviews) · In Stock",
    tags: "product headphones wireless bluetooth audio noise cancelling acoustic electronics spatial sound apexpro",
    price: 299.99,
    rating: 4.9,
    brand: "ApexAudio",
    specs: ["40mm Titanium Drivers", "40-Hour Battery", "Spatial 3D Sound", "Bluetooth 5.3"]
  },
  {
    id: 302,
    title: "UltraBook Pro 16 — M3 Max Workstation Laptop",
    category: "products",
    subType: "Computer Laptop",
    icon: "💻",
    description: "High-performance developer laptop equipped with 16-core CPU, 40-core GPU, 64GB unified memory, and 2TB NVMe PCIe 4.0 SSD storage.",
    content: "Engineered for software engineers, video creators, and AI model training. Features Liquid Retina XDR 120Hz ProMotion display and Thunderbolt 4 ports.",
    meta: "$2,499.00 · ★ 4.8 (890 reviews) · In Stock",
    tags: "product laptop computer macbook ultrabook workstation cpu gpu ram SSD hardware developer programming electronics",
    price: 2499.00,
    rating: 4.8,
    brand: "TechCraft",
    specs: ["16-Core CPU", "64GB Unified RAM", "2TB NVMe SSD", "120Hz Mini-LED Display"]
  },
  {
    id: 303,
    title: "ErgoDesk Pro — Motorized Electric Standing Desk",
    category: "products",
    subType: "Office Furniture",
    icon: "🪑",
    description: "Dual-motor height adjustable standing desk with solid walnut desktop, programmable memory presets, cable management tray, and 350 lbs load capacity.",
    content: "Optimize workspace ergonomics with smooth ultra-quiet dual motor lifts, collision detection, integrated wireless phone charger, and solid hardwood finish.",
    meta: "$549.00 · ★ 4.7 (650 reviews) · In Stock",
    tags: "product desk standing desk office furniture ergonomic home office workstation motorized wooden desk",
    price: 549.00,
    rating: 4.7,
    brand: "ErgoSpace",
    specs: ["Dual Quiet Motors", "350 lbs Max Capacity", "Solid Walnut Wood", "Memory Heights"]
  },
  {
    id: 304,
    title: "VividLens 4K Cinema Mirrorless Camera Body",
    category: "products",
    subType: "Camera Gear",
    icon: "📷",
    description: "Professional full-frame mirrorless camera recording 4K 120fps 10-bit 4:2:2 video with 5-axis in-body image stabilization and AI autofocus tracking.",
    content: "Capture cinematic footage and high-dynamic-range stills. Features dual CFexpress card slots, weather-sealed magnesium alloy chassis, and clean HDMI output.",
    meta: "$1,899.50 · ★ 4.9 (410 reviews) · Low Stock",
    tags: "product camera mirrorless cinema 4k video photography lens stabilization full frame electronics gear",
    price: 1899.50,
    rating: 4.9,
    brand: "VividOptics",
    specs: ["Full-Frame 33MP Sensor", "4K 120fps 10-bit", "5-Axis IBIS", "Dual CFexpress Slots"]
  },
  {
    id: 305,
    title: "Mechanica RGB Hot-Swappable Custom Keyboard",
    category: "products",
    subType: "Peripherals",
    icon: "⌨️",
    description: "Gasket-mounted mechanical keyboard with lubricated linear switches, PBT keycaps, sound dampening foam, and VIA/QMK programmable keymaps.",
    content: "Tactile typing perfection with CNC aluminum case, customizable per-key RGB backlighting, tri-mode wireless/Bluetooth/USB-C connection.",
    meta: "$169.00 · ★ 4.8 (980 reviews) · In Stock",
    tags: "product keyboard mechanical switches gaming peripherals typing custom qmk rgb wireless computer",
    price: 169.00,
    rating: 4.8,
    brand: "KeyWorks",
    specs: ["Gasket Mount", "Hot-Swappable PCB", "CNC Aluminum Body", "QMK / VIA Support"]
  },
  {
    id: 306,
    title: "SonicPulse Studio Reference Monitor Speakers",
    category: "products",
    subType: "Audio Equipment",
    icon: "🔊",
    description: "Bi-amplified active studio monitor speakers delivering ultra-flat frequency response, 8-inch Kevlar woofer, and 140W total output power.",
    content: "Designed for audio mixing, music production, and sound mastering. Features room acoustic tuning controls and balanced XLR inputs.",
    meta: "$399.00 · ★ 4.9 (310 reviews) · In Stock",
    tags: "product speakers studio monitor audio sound mixing audio recording studio reference sound music speaker",
    price: 399.00,
    rating: 4.9,
    brand: "SonicPulse",
    specs: ["8-inch Kevlar Woofer", "140W Bi-Amp Power", "Flat 35Hz-22kHz", "Balanced XLR/TRS"]
  },

  // ==================== CODE SEARCH ====================
  {
    id: 401,
    title: "Async Parallel Vector Search Engine in Rust",
    category: "code",
    subType: "Rust Snippet",
    icon: "🦀",
    description: "Blazing-fast parallel HNSW vector index lookups using Tokio async tasks, SIMD vector dot products, and lock-free atomic atomic counters.",
    content: `use std::sync::Arc;
use tokio::task;

pub struct WasmHnswIndex {
    dim: usize,
    max_elements: usize,
}

impl WasmHnswIndex {
    pub async fn search_knn_parallel(&self, query: &[f32], k: usize) -> Vec<usize> {
        // Compute Euclidean or Cosine distance with SIMD acceleration
        query.iter().enumerate().take(k).map(|(i, _)| i).collect()
    }
}`,
    meta: "Rust · Async / SIMD · 48 Lines",
    tags: "code rust vector search hnsw simd async tokio algorithm index performance WebAssembly function",
    language: "rust",
    snippet: "pub async fn search_knn_parallel(&self, query: &[f32], k: usize) -> Vec<usize>"
  },
  {
    id: 402,
    title: "Python PyTorch Custom Transformer Self-Attention Layer",
    category: "code",
    subType: "Python Deep Learning",
    icon: "🐍",
    description: "Clean PyTorch implementation of multi-head self-attention with scaled dot-product matrix multiplication and causal mask support.",
    content: `import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, embed_dim: int, num_heads: int):
        super().__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.q_proj = nn.Linear(embed_dim, embed_dim)
        self.k_proj = nn.Linear(embed_dim, embed_dim)
        self.v_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

    def forward(self, x, mask=None):
        B, N, C = x.shape
        q = self.q_proj(x).view(B, N, self.num_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(B, N, self.num_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(B, N, self.num_heads, self.head_dim).transpose(1, 2)
        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = torch.softmax(scores, dim=-1)
        out = torch.matmul(attn, v).transpose(1, 2).contiguous().view(B, N, C)
        return self.out_proj(out)`,
    meta: "Python · PyTorch · 32 Lines",
    tags: "code python pytorch transformer attention neural network deep learning machine learning model code",
    language: "python",
    snippet: "def forward(self, x, mask=None): scores = torch.matmul(q, k.transpose(-2, -1))"
  },
  {
    id: 403,
    title: "JavaScript High-Performance WebAssembly Memory Allocator",
    category: "code",
    subType: "JS / WebAssembly",
    icon: "⚡",
    description: "JS wrapper allocating memory buffers (`Float32Array`) directly inside WebAssembly shared linear memory space with minimal overhead.",
    content: `class WasmMemoryBridge {
  constructor(wasmInstance) {
    this.wasm = wasmInstance;
    this.memory = wasmInstance.exports.memory;
  }

  allocateVector(jsFloatArray) {
    const bytes = jsFloatArray.length * 4;
    const ptr = this.wasm.exports._malloc(bytes);
    const heap = new Float32Array(this.memory.buffer, ptr, jsFloatArray.length);
    heap.set(jsFloatArray);
    return ptr;
  }

  free(ptr) {
    if (ptr) this.wasm.exports._free(ptr);
  }
}`,
    meta: "JavaScript · WebAssembly API · 24 Lines",
    tags: "code javascript webassembly wasm memory pointer linear memory float32array array performance web",
    language: "javascript",
    snippet: "allocateVector(jsFloatArray) { const ptr = this.wasm.exports._malloc(bytes); }"
  },
  {
    id: 404,
    title: "SQL Recursive CTE Hierarchical Tree Traversal",
    category: "code",
    subType: "SQL Database Query",
    icon: "🗄️",
    description: "Advanced PostgreSQL recursive Common Table Expression (CTE) query to traverse parent-child category trees and compute aggregate depths.",
    content: `WITH RECURSIVE CategoryHierarchy AS (
    SELECT id, name, parent_id, 0 AS depth, ARRAY[id] AS path
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT c.id, c.name, c.parent_id, ch.depth + 1, ch.path || c.id
    FROM categories c
    INNER JOIN CategoryHierarchy ch ON c.parent_id = ch.id
)
SELECT id, name, depth, array_to_string(path, ' -> ') AS lineage
FROM CategoryHierarchy
ORDER BY path;`,
    meta: "SQL · PostgreSQL · 15 Lines",
    tags: "code sql postgresql database query cte recursive tree hierarchy performance data algorithm",
    language: "sql",
    snippet: "WITH RECURSIVE CategoryHierarchy AS (...) SELECT id, name, depth FROM CategoryHierarchy"
  },
  {
    id: 405,
    title: "C++ HNSW Skip-List Priority Queue Candidate Selection",
    category: "code",
    subType: "C++ Engine",
    icon: "⚙️",
    description: "Core C++ greedy search function traversing graph layers to update entry points and maintain top-K nearest candidate priority queues.",
    content: `#include <vector>
#include <queue>
#include <cmath>

struct CompareDist {
    bool operator()(const std::pair<float, int>& a, const std::pair<float, int>& b) {
        return a.first > b.first; // Min heap by distance
    }
};

float compute_cosine_distance(const float* a, const float* b, int dim) {
    float dot = 0.0f, norm_a = 0.0f, norm_b = 0.0f;
    for (int i = 0; i < dim; ++i) {
        dot += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }
    return 1.0f - (dot / (std::sqrt(norm_a) * std::sqrt(norm_b) + 1e-9f));
}`,
    meta: "C++20 · Vector Engine · 28 Lines",
    tags: "code c++ cpp hnsw cosine distance priority queue vector graph algorithm memory wasm performance",
    language: "cpp",
    snippet: "float compute_cosine_distance(const float* a, const float* b, int dim)"
  },

  // ==================== MUSIC & AUDIO ====================
  {
    id: 501,
    title: "Midnight Synthwave — Cyber City Drive (Chill Beats)",
    category: "audio",
    subType: "Synthwave Music Track",
    icon: "🎵",
    description: "Atmospheric synthwave instrumental featuring vintage analog synthesizers, crisp 80s drums, warm bassline, and nostalgic retro melodies.",
    content: "Instrumentation: Prophet-5 Analog Synth, Roland TR-808 drums, electric bass. Tempo: 110 BPM. Key: D Minor. Vibe: Late night city driving, focus, study.",
    meta: "Audio · 3:45 · 320 kbps MP3 / FLAC",
    tags: "audio music synthwave retro electronic synth focus beats instrumental ambient bpm 110 dminor sound",
    duration: "3:45",
    bpm: 110,
    genre: "Synthwave / Retrowave",
    previewUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3"
  },
  {
    id: 502,
    title: "Acoustic Sunset Guitar & Ambient Strings",
    category: "audio",
    subType: "Acoustic Folk",
    icon: "🎸",
    description: "Warm fingerpicked acoustic guitar paired with soft cello harmonies, gentle room reverb, and serene calming melodies.",
    content: "Instrumentation: Martin D-28 Acoustic, Cello section, soft piano. Tempo: 78 BPM. Key: G Major. Vibe: Relaxing coffee shop, meditation, acoustic background.",
    meta: "Audio · 4:12 · High Quality Audio",
    tags: "audio music acoustic guitar strings chill relaxing calm soft peaceful acoustic folk instrumental bpm 78 gmajor",
    duration: "4:12",
    bpm: 78,
    genre: "Acoustic / Ambient Folk",
    previewUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a735c0.mp3?filename=acoustic-guitar-10821.mp3"
  },
  {
    id: 503,
    title: "Deep Focus Lo-Fi Study Beats (Rainy Afternoon)",
    category: "audio",
    subType: "Lo-Fi Hip-Hop",
    icon: "🎧",
    description: "Relaxing chillhop beats with subtle vinyl crackle, warm rhodes keys, mellow bass, and distant rain soundscapes for productivity.",
    content: "Instrumentation: Fender Rhodes, Dusty SP-404 vinyl sample loops, smooth bass. Tempo: 84 BPM. Key: F Major. Vibe: Coding session, reading, study focus.",
    meta: "Audio · 5:20 · Lo-Fi Track",
    tags: "audio music lofi lofi beats chill focus study rain vinyl coding relaxing beats bpm 84 hiphop",
    duration: "5:20",
    bpm: 84,
    genre: "Lo-Fi Hip-Hop / Chillhop",
    previewUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3"
  },
  {
    id: 504,
    title: "Podcast Ep 42: The Future of Quantum Computing & AI",
    category: "audio",
    subType: "Podcast Episode",
    icon: "🎙️",
    description: "In-depth interview with quantum physicists discussing qubit coherence, fault-tolerant error correction, and quantum AI algorithms.",
    content: "Episode topics: Superconducting transmon qubits, Shor's algorithm, quantum supremacy benchmarks, integration with neural network transformers.",
    meta: "Audio Podcast · 48:30 · Speech",
    tags: "audio podcast interview quantum computing artificial intelligence physics science technology speech audio",
    duration: "48:30",
    bpm: null,
    genre: "Tech & Science Podcast",
    previewUrl: "#"
  },
  {
    id: 505,
    title: "Thunderstorm & Heavy Forest Rain Soundscape",
    category: "audio",
    subType: "Sound Effect / Nature",
    icon: "🌧️",
    description: "Binaural 3D field recording of rain falling on pine leaves with rolling distant thunder claps and gentle wind noise.",
    content: "High-fidelity spatial audio capture. Ideal for sleep masking, white noise, tinnitus relief, or background atmospheric sound.",
    meta: "Audio Nature · 60:00 · 3D Spatial Audio",
    tags: "audio sound nature rain thunderstorm rain sounds white noise sleep focus relaxing forest binaural",
    duration: "60:00",
    bpm: null,
    genre: "Nature Soundscape",
    previewUrl: "#"
  },

  // ==================== EDUCATIONAL SEARCH ====================
  {
    id: 601,
    title: "Calculus III: Multivariable Integration & Vector Calculus",
    category: "education",
    subType: "Math Course Lesson",
    icon: "📐",
    description: "Interactive mathematics guide covering partial derivatives, double and triple integrals, Green's theorem, Stokes' theorem, and gradient fields.",
    content: "Master vector calculus concepts step-by-step. Includes step-by-step worked solutions for computing flux across 3D surfaces and line integrals in conservative vector fields.",
    meta: "Mathematics · University Level · 14 Modules",
    tags: "education mathematics calculus vector integral derivatives math geometry university lesson study guide",
    subject: "Mathematics",
    level: "Undergraduate",
    concepts: ["Partial Derivatives", "Stokes' Theorem", "Gradient Fields", "Surface Integrals"]
  },
  {
    id: 602,
    title: "Quantum Mechanics & Wave-Particle Duality Principles",
    category: "education",
    subType: "Physics Tutorial",
    icon: "⚛️",
    description: "Comprehensive physics tutorial covering the Schrödinger wave equation, Heisenberg uncertainty principle, quantum tunneling, and photon energy levels.",
    content: "Explore the fundamental laws governing subatomic particles. Learn how wavefunctions collapse upon measurement and solve the particle-in-a-box energy eigenstate equations.",
    meta: "Physics · Advanced Level · 10 Lessons",
    tags: "education physics quantum schrodinger wave particle mechanics energy science lecture tutorial lesson",
    subject: "Physics",
    level: "Advanced / College",
    concepts: ["Schrödinger Equation", "Uncertainty Principle", "Quantum Tunneling", "Wavefunction"]
  },
  {
    id: 603,
    title: "Cellular Biology: Photosynthesis & Mitochondrial Respiration",
    category: "education",
    subType: "Biology Visual Guide",
    icon: "🌿",
    description: "Visual study module illustrating the Light-Dependent Reactions, Calvin Cycle, ATP Synthase molecular motor, and Electron Transport Chain.",
    content: "Detailed breakdown of chloroplast thylakoid membrane processes. Learn how photons split water molecules to generate NADPH and ATP energy for carbon fixation.",
    meta: "Biology · High School / AP Level · Diagrams",
    tags: "education biology photosynthesis respiration mitochondria cells ATP plants science study guide diagrams",
    subject: "Biology",
    level: "High School / AP",
    concepts: ["Calvin Cycle", "Light Reactions", "ATP Synthase", "Electron Transport Chain"]
  },
  {
    id: 604,
    title: "World History: Industrial Revolution & Technological Innovation",
    category: "education",
    subType: "History Timeline",
    icon: "📜",
    description: "Historical analysis tracing the invention of the steam engine, mechanization of textiles, rise of railways, and urbanization socio-economic impacts.",
    content: "Examine key historical primary sources from 1760 to 1910. Analyzes economic shifts from agrarian societies to industrial factory economies.",
    meta: "History · World History · Interactive Timeline",
    tags: "education history timeline industrial revolution steam engine innovation society economics school history",
    subject: "History",
    level: "General Education",
    concepts: ["Steam Engine", "Factory System", "Urbanization", "Labor Movements"]
  },
  {
    id: 605,
    title: "Organic Chemistry: Reaction Mechanisms & Functional Groups",
    category: "education",
    subType: "Chemistry Study Set",
    icon: "🧪",
    description: "Complete organic synthesis reference detailing SN1, SN2 nucleophilic substitutions, E1/E2 elimination reactions, and aromaticity rules.",
    content: "Interactive reaction mechanism diagrams showing electron curved arrows, transition state carbocation stability, and stereochemistry retention/inversion.",
    meta: "Chemistry · College Level · 12 Units",
    tags: "education chemistry organic synthesis reaction mechanism molecules sn1 sn2 carbon science chemistry lesson",
    subject: "Chemistry",
    level: "College / Pre-Med",
    concepts: ["Nucleophilic Substitution", "Carbocation Stability", "Stereochemistry", "Resonance"]
  }
];

// Add vector embeddings to all items in raw catalog
const catalogItems = rawCatalog.map(item => {
  const vector = generateSemanticVector(item.category, item.title + " " + item.description + " " + item.content, item.tags);
  return {
    ...item,
    vector: vector
  };
});

window.OMNIFIND_CATALOG = catalogItems;
