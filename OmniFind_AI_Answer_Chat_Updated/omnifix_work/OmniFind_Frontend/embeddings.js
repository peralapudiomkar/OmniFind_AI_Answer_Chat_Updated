/**
 * OmniFind Embedding & BM25 Keyword Search Engine
 * Provides vector distance functions, text-to-vector projections,
 * and BM25 keyword scoring for hybrid search integration.
 */

(function (window) {
  'use strict';

  const VECTOR_DIM = 32;

  // Vector normalization utility
  function normalize(vec) {
    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(sumSq);
    if (norm === 0) return vec;
    return vec.map(v => v / norm);
  }

  // Generate a 32-dimensional query vector matching document embeddings space
  function generateQueryEmbedding(queryText) {
    const vec = new Array(VECTOR_DIM).fill(0.01);
    if (!queryText || !queryText.trim()) return normalize(vec);

    const text = queryText.toLowerCase().trim();
    const words = text.split(/\W+/).filter(w => w.length > 1);

    // Keyword domain associations to align query embeddings with catalog domains
    const domainKeywords = {
      documents: ['pdf', 'doc', 'paper', 'report', 'research', 'file', 'contract', 'whitepaper', 'notes', 'study'],
      images: ['image', 'photo', 'picture', 'artwork', 'wallpaper', 'ui', 'mockup', 'design', 'neon', 'lake', 'view'],
      products: ['product', 'buy', 'headphone', 'laptop', 'camera', 'keyboard', 'speaker', 'desk', 'wireless', 'price', 'gear'],
      code: ['code', 'python', 'javascript', 'rust', 'cpp', 'c++', 'sql', 'function', 'async', 'algorithm', 'pytorch'],
      audio: ['audio', 'music', 'sound', 'track', 'song', 'podcast', 'beat', 'synthwave', 'guitar', 'rain', 'lofi'],
      education: ['education', 'math', 'physics', 'biology', 'history', 'chemistry', 'calculus', 'lesson', 'tutorial', 'learn']
    };

    // Category offset biases
    const categoryBias = {
      documents: 0,
      images: 4,
      products: 8,
      code: 12,
      audio: 16,
      education: 20
    };

    words.forEach(word => {
      // Check domain keyword matches
      for (const [cat, keywords] of Object.entries(domainKeywords)) {
        if (keywords.some(k => word.includes(k) || k.includes(word))) {
          const offset = categoryBias[cat];
          for (let i = 0; i < 4; i++) {
            vec[offset + i] += 0.8;
          }
        }
      }

      // Hash individual words to vector features
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % VECTOR_DIM;
      const weight = 0.3 + (word.length * 0.1);
      vec[idx] += weight;
    });

    return normalize(vec);
  }

  // Vector distance calculation
  function computeDistance(vecA, vecB, metric = 'cosine') {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 1.0;

    if (metric === 'cosine') {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-9);
      // Cosine distance = 1 - similarity
      return Math.max(0, 1 - sim);
    } else if (metric === 'l2') {
      let sum = 0;
      for (let i = 0; i < vecA.length; i++) {
        const diff = vecA[i] - vecB[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    } else if (metric === 'dot') {
      let dot = 0;
      for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
      }
      // Distance is negated dot product for sorting
      return -dot;
    }
    return 1.0;
  }

  // Convert vector distance to human-readable similarity percentage (0% to 100%)
  function distanceToSimilarityPercent(dist, metric = 'cosine') {
    if (metric === 'cosine') {
      const sim = Math.max(0, 1 - dist);
      return Math.round(sim * 1000) / 10;
    } else if (metric === 'l2') {
      // Convert L2 distance to similarity score via exponential decay
      const sim = Math.exp(-dist * 1.2);
      return Math.round(sim * 1000) / 10;
    } else if (metric === 'dot') {
      // Dot product similarity
      const sim = Math.max(0, Math.min(1, -dist));
      return Math.round(sim * 1000) / 10;
    }
    return 50.0;
  }

  // BM25 Full-Text Search Engine
  function computeBM25Score(query, item, totalDocs = 60, avgDocLength = 50) {
    if (!query || !query.trim()) return 0.0;

    const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 1);
    if (!terms.length) return 0.0;

    const k1 = 1.5;
    const b = 0.75;

    // Field weights
    const titleText = (item.title || '').toLowerCase();
    const tagsText = (item.tags || '').toLowerCase();
    const descText = (item.description || '').toLowerCase();
    const contentText = (item.content || item.snippet || '').toLowerCase();
    const metaText = (item.meta || '').toLowerCase();

    const fullDocText = `${titleText} ${titleText} ${tagsText} ${tagsText} ${descText} ${contentText} ${metaText}`;
    const docTokens = fullDocText.split(/\W+/).filter(Boolean);
    const docLen = docTokens.length;

    let score = 0;

    terms.forEach(term => {
      // Calculate term frequency with field multipliers
      let tf = 0;
      if (titleText.includes(term)) tf += 4.0;
      if (tagsText.includes(term)) tf += 3.0;
      if (descText.includes(term)) tf += 2.0;
      if (contentText.includes(term)) tf += 1.0;
      if (metaText.includes(term)) tf += 1.5;

      if (tf > 0) {
        // Pseudo IDF calculation
        const docFreqEst = 5; 
        const idf = Math.log((totalDocs - docFreqEst + 0.5) / (docFreqEst + 0.5) + 1.0);
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLength));
        score += idf * (numerator / denominator);
      }
    });

    return score;
  }

  window.OmniFindEmbeddings = {
    VECTOR_DIM,
    normalize,
    generateQueryEmbedding,
    computeDistance,
    distanceToSimilarityPercent,
    computeBM25Score
  };

})(window);
