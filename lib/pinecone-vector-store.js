"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeVectorStore = void 0;
exports.semanticSearchPinecone = semanticSearchPinecone;
exports.hybridSearchPinecone = hybridSearchPinecone;
var pinecone_client_1 = require("./pinecone-client");
var embedding_generator_1 = require("./embedding-generator");
var PineconeVectorStore = /** @class */ (function () {
    function PineconeVectorStore(namespace) {
        if (namespace === void 0) { namespace = 'default'; }
        this.namespace = namespace;
    }
    // Add embeddings to Pinecone
    PineconeVectorStore.prototype.add = function (embeddings) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (embeddings.length === 0)
                            return [2 /*return*/];
                        console.log("Adding ".concat(embeddings.length, " embeddings to Pinecone..."));
                        return [4 /*yield*/, (0, pinecone_client_1.upsertEmbeddings)(embeddings, this.namespace)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Search for similar vectors
    PineconeVectorStore.prototype.search = function (queryEmbedding_1) {
        return __awaiter(this, arguments, void 0, function (queryEmbedding, options) {
            var _a, topK, _b, minScore, filter, matches;
            var _c, _d, _e, _f;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = options.topK, topK = _a === void 0 ? 5 : _a, _b = options.minScore, minScore = _b === void 0 ? 0 : _b, filter = options.filter;
                        return [4 /*yield*/, (0, pinecone_client_1.searchSimilar)(queryEmbedding, {
                                topK: topK,
                                namespace: this.namespace,
                                filter: filter,
                                includeMetadata: true,
                            })];
                    case 1:
                        matches = _g.sent();
                        // Log first match for debugging
                        if (matches.length > 0) {
                            console.log('[PineconeVectorStore] First match details:', {
                                id: matches[0].id,
                                score: matches[0].score,
                                metadataKeys: Object.keys(matches[0].metadata || {}),
                                textLength: ((_d = (_c = matches[0].metadata) === null || _c === void 0 ? void 0 : _c.text) === null || _d === void 0 ? void 0 : _d.length) || 0,
                                textPreview: ((_f = (_e = matches[0].metadata) === null || _e === void 0 ? void 0 : _e.text) === null || _f === void 0 ? void 0 : _f.substring(0, 100)) || 'NO TEXT',
                                fullMetadata: matches[0].metadata
                            });
                        }
                        // Convert Pinecone results to our format
                        return [2 /*return*/, matches
                                .filter(function (match) { return match.score >= minScore; })
                                .map(function (match) { return ({
                                chunk: {
                                    id: match.id,
                                    text: match.metadata.text || 'NO TEXT FOUND',
                                    embedding: [], // We don't return embeddings from search
                                    metadata: match.metadata,
                                    tokens: match.metadata.tokens || 0,
                                },
                                score: match.score,
                            }); })];
                }
            });
        });
    };
    // Clear all vectors
    PineconeVectorStore.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Clearing namespace: ".concat(this.namespace));
                        return [4 /*yield*/, (0, pinecone_client_1.clearNamespace)(this.namespace)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Get store statistics
    PineconeVectorStore.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats, namespaceStats;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, pinecone_client_1.getIndexStats)()];
                    case 1:
                        stats = _b.sent();
                        namespaceStats = ((_a = stats.namespaces) === null || _a === void 0 ? void 0 : _a[this.namespace]) || { vectorCount: 0 };
                        return [2 /*return*/, {
                                totalVectors: namespaceStats.vectorCount || 0,
                                dimension: stats.dimension,
                                indexFullness: stats.indexFullness,
                                namespaces: Object.keys(stats.namespaces || {}),
                            }];
                }
            });
        });
    };
    return PineconeVectorStore;
}());
exports.PineconeVectorStore = PineconeVectorStore;
// Advanced search with query text
function semanticSearchPinecone(query_1) {
    return __awaiter(this, arguments, void 0, function (query, options) {
        var queryEmbedding, store;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, embedding_generator_1.generateQueryEmbedding)(query)];
                case 1:
                    queryEmbedding = _a.sent();
                    if (!queryEmbedding) {
                        console.error('Failed to generate query embedding');
                        return [2 /*return*/, []];
                    }
                    store = new PineconeVectorStore(options.namespace);
                    return [2 /*return*/, store.search(queryEmbedding, options)];
            }
        });
    });
}
// Hybrid search simulation (vector + keyword matching in metadata)
function hybridSearchPinecone(query_1) {
    return __awaiter(this, arguments, void 0, function (query, options) {
        var _a, topK, _b, namespace, _c, vectorWeight, vectorResults, queryLower, rerankedResults, finalResults;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.topK, topK = _a === void 0 ? 5 : _a, _b = options.namespace, namespace = _b === void 0 ? 'default' : _b, _c = options.vectorWeight, vectorWeight = _c === void 0 ? 0.7 : _c;
                    console.log('[HYBRID-SEARCH] Starting search:', {
                        query: query,
                        topK: topK,
                        namespace: namespace,
                        vectorWeight: vectorWeight
                    });
                    return [4 /*yield*/, semanticSearchPinecone(query, {
                            topK: topK * 2, // Get more for reranking
                            namespace: namespace,
                        })];
                case 1:
                    vectorResults = _d.sent();
                    console.log("[HYBRID-SEARCH] Vector search returned ".concat(vectorResults.length, " results"));
                    queryLower = query.toLowerCase();
                    rerankedResults = vectorResults.map(function (result) {
                        var keywordScore = 0;
                        var text = result.chunk.text.toLowerCase();
                        // Simple keyword matching
                        var words = queryLower.split(' ');
                        words.forEach(function (word) {
                            if (text.includes(word)) {
                                keywordScore += 1 / words.length;
                            }
                        });
                        // Combine scores
                        var combinedScore = (result.score * vectorWeight) + (keywordScore * (1 - vectorWeight));
                        return __assign(__assign({}, result), { score: combinedScore });
                    });
                    finalResults = rerankedResults
                        .sort(function (a, b) { return b.score - a.score; })
                        .slice(0, topK);
                    console.log("[HYBRID-SEARCH] Returning ".concat(finalResults.length, " results after reranking"));
                    return [2 /*return*/, finalResults];
            }
        });
    });
}
