/**
 * OmniFind HNSW (Hierarchical Navigable Small World) Vector Search Engine
 * Native C++ Implementation compiled to WebAssembly (WASM).
 * 
 * Features:
 * - Multi-layer skip-graph structure for fast k-NN vector search.
 * - Distance metrics: Cosine Distance, L2 Euclidean, Dot Product.
 * - Dynamic insertion with layer selection via decay probability.
 * - Beam search (efConstruction, efSearch) with priority queue candidates.
 * - C / WebAssembly C-API exports for JS interop.
 */

#include <iostream>
#include <vector>
#include <queue>
#include <unordered_set>
#include <cmath>
#include <random>
#include <algorithm>
#include <memory>
#include <chrono>

#if defined(__EMSCRIPTEN__)
#include <emscripten/emscripten.h>
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define WASM_EXPORT
#endif

// Distance Metric Types
enum DistanceMetric {
    METRIC_COSINE = 0,
    METRIC_L2 = 1,
    METRIC_DOT = 2
};

// Compute distance between two float vectors
inline float calc_distance(const float* a, const float* b, int dim, int metric) {
    if (metric == METRIC_COSINE) {
        float dot = 0.0f, norm_a = 0.0f, norm_b = 0.0f;
        for (int i = 0; i < dim; ++i) {
            dot += a[i] * b[i];
            norm_a += a[i] * a[i];
            norm_b += b[i] * b[i];
        }
        float norm_prod = std::sqrt(norm_a) * std::sqrt(norm_b);
        if (norm_prod < 1e-9f) return 1.0f;
        float sim = dot / norm_prod;
        return std::max(0.0f, 1.0f - sim);
    } else if (metric == METRIC_L2) {
        float sum = 0.0f;
        for (int i = 0; i < dim; ++i) {
            float diff = a[i] - b[i];
            sum += diff * diff;
        }
        return std::sqrt(sum);
    } else { // METRIC_DOT
        float dot = 0.0f;
        for (int i = 0; i < dim; ++i) {
            dot += a[i] * b[i];
        }
        return -dot;
    }
}

// HNSW Node Structure
struct Node {
    int id;
    int level;
    std::vector<float> vector;
    // Adjacency lists for each layer: neighbors[layer] = vector of node IDs
    std::vector<std::vector<int>> neighbors;

    Node(int id, int level, const float* vec, int dim)
        : id(id), level(level), vector(vec, vec + dim), neighbors(level + 1) {}
};

// Priority Pair: (distance, node_id)
typedef std::pair<float, int> DistNode;

// Comparator for Min Heap (smallest distance first)
struct MinHeapCompare {
    bool operator()(const DistNode& a, const DistNode& b) const {
        return a.first > b.first;
    }
};

// Comparator for Max Heap (largest distance first)
struct MaxHeapCompare {
    bool operator()(const DistNode& a, const DistNode& b) const {
        return a.first < b.first;
    }
};

// HNSW Graph Index Class
class HNSWIndex {
private:
    int dim;
    int M;             // Max edges per node per level
    int M0;            // Max edges at level 0 (typically 2 * M)
    int efConstruction;
    double mL;         // Level normalization multiplier
    int metric;
    int enterNodeId;   // Global entry node ID
    int maxLevel;      // Current max level in graph
    
    std::vector<std::unique_ptr<Node>> nodes;
    std::mt19937 rng;
    std::uniform_real_distribution<double> uniformDist;

    // Helper: Select random level for new node
    int getRandomLevel() {
        double r = uniformDist(rng);
        if (r == 0) r = 0.0000001;
        int lvl = static_cast<int>(-std::log(r) * mL);
        return lvl;
    }

public:
    HNSWIndex(int dim, int M = 16, int efConstruction = 64, int metric = METRIC_COSINE)
        : dim(dim), M(M), M0(2 * M), efConstruction(efConstruction),
          metric(metric), enterNodeId(-1), maxLevel(-1), rng(1337), uniformDist(0.0, 1.0) {
        mL = 1.0 / std::log(static_cast<double>(M));
    }

    void setMetric(int newMetric) {
        metric = newMetric;
    }

    // Search a single graph layer for ef nearest neighbors
    std::priority_queue<DistNode, std::vector<DistNode>, MaxHeapCompare>
    searchLayer(const float* queryVec, const std::vector<int>& entryPoints, int ef, int level) {
        std::priority_queue<DistNode, std::vector<DistNode>, MinHeapCompare> candidateSet;
        std::priority_queue<DistNode, std::vector<DistNode>, MaxHeapCompare> topCandidates;
        std::unordered_set<int> visited;

        for (int epId : entryPoints) {
            float d = calc_distance(queryVec, nodes[epId]->vector.data(), dim, metric);
            visited.insert(epId);
            candidateSet.push({d, epId});
            topCandidates.push({d, epId});
        }

        while (!candidateSet.empty()) {
            DistNode curr = candidateSet.top();
            candidateSet.pop();

            DistNode worstTop = topCandidates.top();
            if (curr.first > worstTop.first) {
                break;
            }

            Node* currNode = nodes[curr.second].get();
            if (level >= static_cast<int>(currNode->neighbors.size())) continue;

            for (int neighborId : currNode->neighbors[level]) {
                if (visited.find(neighborId) == visited.end()) {
                    visited.insert(neighborId);
                    float d = calc_distance(queryVec, nodes[neighborId]->vector.data(), dim, metric);

                    if (d < topCandidates.top().first || static_cast<int>(topCandidates.size()) < ef) {
                        candidateSet.push({d, neighborId});
                        topCandidates.push({d, neighborId});

                        if (static_cast<int>(topCandidates.size()) > ef) {
                            topCandidates.pop();
                        }
                    }
                }
            }
        }

        return topCandidates;
    }

    // Insert a new vector into the HNSW index
    void insert(int id, const float* vec) {
        int insertLvl = getRandomLevel();
        int newNodeIdx = static_cast<int>(nodes.size());
        nodes.push_back(std::make_unique<Node>(id, insertLvl, vec, dim));

        int currObj = enterNodeId;
        int currMaxLvl = maxLevel;

        if (currObj != -1) {
            // Greedy search top layers down to insertLvl + 1
            float currDist = calc_distance(vec, nodes[currObj]->vector.data(), dim, metric);
            for (int l = currMaxLvl; l > insertLvl; --l) {
                bool changed = true;
                while (changed) {
                    changed = false;
                    for (int neighborId : nodes[currObj]->neighbors[l]) {
                        float d = calc_distance(vec, nodes[neighborId]->vector.data(), dim, metric);
                        if (d < currDist) {
                            currDist = d;
                            currObj = neighborId;
                            changed = true;
                        }
                    }
                }
            }

            // Beam search from min(currMaxLvl, insertLvl) down to 0
            std::vector<int> eps = {currObj};
            for (int l = std::min(currMaxLvl, insertLvl); l >= 0; --l) {
                auto candidates = searchLayer(vec, eps, efConstruction, l);
                
                // Extract candidates into vector
                std::vector<DistNode> candList;
                while (!candidates.empty()) {
                    candList.push_back(candidates.top());
                    candidates.pop();
                }
                std::reverse(candList.begin(), candList.end());

                // Select M closest neighbors
                int maxM = (l == 0) ? M0 : M;
                int connectCount = std::min(static_cast<int>(candList.size()), maxM);

                eps.clear();
                for (int i = 0; i < connectCount; ++i) {
                    int neighborIdx = candList[i].second;
                    nodes[newNodeIdx]->neighbors[l].push_back(neighborIdx);
                    nodes[neighborIdx]->neighbors[l].push_back(newNodeIdx);
                    eps.push_back(neighborIdx);

                    // Shrink neighbors if over capacity
                    if (static_cast<int>(nodes[neighborIdx]->neighbors[l].size()) > maxM) {
                        // Prune neighbor list
                        auto& nList = nodes[neighborIdx]->neighbors[l];
                        std::vector<DistNode> sortedN;
                        for (int nId : nList) {
                            float d = calc_distance(nodes[neighborIdx]->vector.data(), nodes[nId]->vector.data(), dim, metric);
                            sortedN.push_back({d, nId});
                        }
                        std::sort(sortedN.begin(), sortedN.end());
                        nList.clear();
                        for (int k = 0; k < maxM; ++k) {
                            nList.push_back(sortedN[k].second);
                        }
                    }
                }
            }
        }

        if (insertLvl > maxLevel || enterNodeId == -1) {
            maxLevel = insertLvl;
            enterNodeId = newNodeIdx;
        }
    }

    // Search K-Nearest Neighbors
    std::vector<std::pair<int, float>> searchKnn(const float* queryVec, int k, int efSearch = 32) {
        std::vector<std::pair<int, float>> results;
        if (enterNodeId == -1 || nodes.empty()) return results;

        int currObj = enterNodeId;
        float currDist = calc_distance(queryVec, nodes[currObj]->vector.data(), dim, metric);

        // Top layers down to level 1 greedy search
        for (int l = maxLevel; l > 0; --l) {
            bool changed = true;
            while (changed) {
                changed = false;
                if (l < static_cast<int>(nodes[currObj]->neighbors.size())) {
                    for (int neighborId : nodes[currObj]->neighbors[l]) {
                        float d = calc_distance(queryVec, nodes[neighborId]->vector.data(), dim, metric);
                        if (d < currDist) {
                            currDist = d;
                            currObj = neighborId;
                            changed = true;
                        }
                    }
                }
            }
        }

        // Layer 0 beam search
        auto topCandidates = searchLayer(queryVec, {currObj}, std::max(efSearch, k), 0);

        std::vector<DistNode> candList;
        while (!topCandidates.empty()) {
            candList.push_back(topCandidates.top());
            topCandidates.pop();
        }
        std::reverse(candList.begin(), candList.end());

        int count = std::min(static_cast<int>(candList.size()), k);
        for (int i = 0; i < count; ++i) {
            int nodeIdx = candList[i].second;
            int externalId = nodes[nodeIdx]->id;
            float dist = candList[i].first;
            results.push_back({externalId, dist});
        }

        return results;
    }

    int getNodeCount() const { return static_cast<int>(nodes.size()); }
    int getMaxLevel() const { return maxLevel; }
    
    // Get edge count stats
    int getTotalEdgeCount() const {
        int total = 0;
        for (const auto& node : nodes) {
            for (const auto& lList : node->neighbors) {
                total += static_cast<int>(lList.size());
            }
        }
        return total;
    }
};

// ============================================================================
// WebAssembly C-API Export Interface
// ============================================================================

extern "C" {

WASM_EXPORT HNSWIndex* hnsw_create(int dim, int M, int efConstruction, int metric) {
    return new HNSWIndex(dim, M, efConstruction, metric);
}

WASM_EXPORT void hnsw_free(HNSWIndex* index) {
    if (index) delete index;
}

WASM_EXPORT void hnsw_set_metric(HNSWIndex* index, int metric) {
    if (index) index->setMetric(metric);
}

WASM_EXPORT void hnsw_add_item(HNSWIndex* index, int external_id, const float* vector_ptr) {
    if (index && vector_ptr) {
        index->insert(external_id, vector_ptr);
    }
}

WASM_EXPORT int hnsw_search_knn(
    HNSWIndex* index,
    const float* query_vector_ptr,
    int k,
    int ef_search,
    int* out_ids_ptr,
    float* out_dists_ptr
) {
    if (!index || !query_vector_ptr || !out_ids_ptr || !out_dists_ptr) return 0;
    
    auto results = index->searchKnn(query_vector_ptr, k, ef_search);
    for (size_t i = 0; i < results.size(); ++i) {
        out_ids_ptr[i] = results[i].first;
        out_dists_ptr[i] = results[i].second;
    }
    return static_cast<int>(results.size());
}

WASM_EXPORT void hnsw_get_stats(HNSWIndex* index, int* out_stats_ptr) {
    if (!index || !out_stats_ptr) return;
    out_stats_ptr[0] = index->getNodeCount();
    out_stats_ptr[1] = index->getMaxLevel();
    out_stats_ptr[2] = index->getTotalEdgeCount();
}

} // extern "C"
