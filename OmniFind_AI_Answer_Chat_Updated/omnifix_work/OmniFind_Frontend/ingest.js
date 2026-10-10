/**
 * OmniFind File & Document Ingestion Engine (ingest.js)
 * Parses uploaded documents, PDFs, images, code files, audio tracks, and custom JSON,
 * computes live vector embeddings, and indexes them into WebAssembly HNSW graph in real time.
 */

(function (window) {
  'use strict';

  let nextCustomId = 9000;

  /**
   * Extract content text and category metadata from an uploaded browser File object
   */
  async function parseUploadedFile(file) {
    const fileName = file.name || 'Untitled File';
    const ext = fileName.split('.').pop().toLowerCase();
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    let category = 'documents';
    let subType = ext.toUpperCase() + ' File';
    let icon = '📄';
    let textContent = '';
    let tags = `${ext} custom uploaded file document user ingest`;
    let meta = `${ext.toUpperCase()} · ${fileSizeMB} MB · User File`;
    let previewUrl = '#';

    // File type classification
    if (['pdf'].includes(ext)) {
      category = 'documents';
      subType = 'PDF Document';
      icon = '📄';
      textContent = await readAsTextSnippet(file);
      tags += ' pdf paper research text document';
    } else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      category = 'images';
      subType = 'Image Asset';
      icon = '🖼️';
      previewUrl = URL.createObjectURL(file);
      textContent = `Uploaded image asset ${fileName} with resolution preview and visual features.`;
      tags += ' image photo visual wallpaper photo design artwork';
      meta = `Image · ${fileSizeMB} MB · ${ext.toUpperCase()}`;
    } else if (['js', 'py', 'rs', 'cpp', 'c', 'html', 'css', 'ts', 'java', 'sql', 'json'].includes(ext)) {
      category = 'code';
      subType = `${ext.toUpperCase()} Source Code`;
      icon = '&lt;/&gt;';
      textContent = await readAsTextSnippet(file);
      tags += ` code snippet programming ${ext} developer algorithm source`;
      meta = `${ext.toUpperCase()} · Code File · ${fileSizeMB} MB`;
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      category = 'audio';
      subType = 'Audio Track';
      icon = '🎵';
      previewUrl = URL.createObjectURL(file);
      textContent = `Uploaded audio sound recording ${fileName} with track spectrum metadata.`;
      tags += ' audio music sound track soundscape podcast mp3 wav';
      meta = `Audio · ${ext.toUpperCase()} · ${fileSizeMB} MB`;
    } else if (['txt', 'md', 'docx', 'csv', 'rtf'].includes(ext)) {
      category = 'documents';
      subType = 'Text Document';
      icon = '📝';
      textContent = await readAsTextSnippet(file);
      tags += ' text document notes markdown paper report';
    }

    if (!textContent || textContent.trim().length === 0) {
      textContent = `Content snippet for ${fileName}. This document was indexed into WebAssembly HNSW vector graph in real time.`;
    }

    const title = fileName;
    const description = textContent.slice(0, 180) + (textContent.length > 180 ? '...' : '');

    // Generate semantic vector embedding for uploaded file
    const vector = window.OmniFindEmbeddings
      ? window.OmniFindEmbeddings.generateQueryEmbedding(`${title} ${description} ${tags}`)
      : new Array(32).fill(0.05);

    const newItem = {
      id: nextCustomId++,
      title,
      category,
      subType,
      icon,
      description,
      content: textContent,
      meta,
      tags,
      vector,
      previewUrl,
      author: 'User Upload',
      date: new Date().toISOString().split('T')[0]
    };

    return newItem;
  }

  function readAsTextSnippet(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file.slice(0, 10000)); // Read first 10KB
    });
  }

  window.OmniFindIngest = {
    parseUploadedFile
  };

})(window);
