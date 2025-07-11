"use strict";
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
exports.VectorStore = void 0;
exports.getVectorStore = getVectorStore;
var vectra_1 = require("vectra");
var redis_1 = require("redis");
var VectorStore = /** @class */ (function () {
    function VectorStore() {
        this.index = null;
        this.chunks = new Map();
        this.lastSaved = null;
        this.REDIS_KEY = 'ai:vector-store';
        this.AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.autoSaveTimer = null;
        // Initialize empty - will be populated on first use
    }
    // Initialize or reinitialize the index
    VectorStore.prototype.initializeIndex = function (dimension) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.index = new vectra_1.LocalIndex(".vectra-index-".concat(dimension));
                        return [4 /*yield*/, this.index.isIndexCreated()];
                    case 1:
                        if (!!(_a.sent())) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.index.createIndex()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Add embeddings to the store
    VectorStore.prototype.add = function (embeddings) {
        return __awaiter(this, void 0, void 0, function () {
            var dimension, _i, embeddings_1, chunk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (embeddings.length === 0)
                            return [2 /*return*/];
                        if (!!this.index) return [3 /*break*/, 2];
                        dimension = embeddings[0].embedding.length;
                        return [4 /*yield*/, this.initializeIndex(dimension)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _i = 0, embeddings_1 = embeddings;
                        _a.label = 3;
                    case 3:
                        if (!(_i < embeddings_1.length)) return [3 /*break*/, 6];
                        chunk = embeddings_1[_i];
                        return [4 /*yield*/, this.index.insertItem({
                                vector: chunk.embedding,
                                metadata: { id: chunk.id },
                            })];
                    case 4:
                        _a.sent();
                        this.chunks.set(chunk.id, chunk);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        // Schedule auto-save
                        this.scheduleAutoSave();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Search for similar vectors
    VectorStore.prototype.search = function (queryEmbedding_1) {
        return __awaiter(this, arguments, void 0, function (queryEmbedding, options) {
            var _a, topK, _b, minScore, results, searchResults, _i, results_1, result, chunkId, chunk;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = options.topK, topK = _a === void 0 ? 5 : _a, _b = options.minScore, minScore = _b === void 0 ? 0 : _b;
                        if (!this.index || this.chunks.size === 0) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.index.queryItems(queryEmbedding, topK)];
                    case 1:
                        results = _c.sent();
                        searchResults = [];
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            chunkId = result.item.metadata.id;
                            chunk = this.chunks.get(chunkId);
                            if (chunk && result.score >= minScore) {
                                searchResults.push({
                                    chunk: chunk,
                                    score: result.score,
                                });
                            }
                        }
                        return [2 /*return*/, searchResults];
                }
            });
        });
    };
    // Remove a vector by ID
    VectorStore.prototype.remove = function (chunkId) {
        return __awaiter(this, void 0, void 0, function () {
            var items, itemToRemove;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.index)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.index.listItems()];
                    case 1:
                        items = _a.sent();
                        itemToRemove = items.find(function (item) { return item.metadata.id === chunkId; });
                        if (!itemToRemove) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.index.deleteItem(itemToRemove.id)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        // Remove from map
                        this.chunks.delete(chunkId);
                        // Schedule auto-save
                        this.scheduleAutoSave();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Clear all vectors
    VectorStore.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var items, _i, items_1, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.index) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.index.listItems()];
                    case 1:
                        items = _a.sent();
                        _i = 0, items_1 = items;
                        _a.label = 2;
                    case 2:
                        if (!(_i < items_1.length)) return [3 /*break*/, 5];
                        item = items_1[_i];
                        return [4 /*yield*/, this.index.deleteItem(item.id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        this.chunks.clear();
                        this.cancelAutoSave();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Get store statistics
    VectorStore.prototype.getStats = function () {
        var memoryUsage = this.estimateMemoryUsage();
        return {
            totalVectors: this.chunks.size,
            lastUpdated: this.lastSaved,
            memoryUsage: memoryUsage,
        };
    };
    // Estimate memory usage
    VectorStore.prototype.estimateMemoryUsage = function () {
        if (this.chunks.size === 0)
            return 0;
        // Estimate: ~4 bytes per float * embedding dimension * number of chunks
        var sampleChunk = this.chunks.values().next().value;
        if (!sampleChunk)
            return 0;
        var embeddingSize = sampleChunk.embedding.length * 4;
        var metadataSize = 1000; // Rough estimate for metadata per chunk
        var totalSize = this.chunks.size * (embeddingSize + metadataSize);
        return totalSize;
    };
    // Save to Redis
    VectorStore.prototype.saveToRedis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var redisUrl, client, storeData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        redisUrl = process.env.REDIS_URL || process.env.KV_URL;
                        if (!redisUrl || this.chunks.size === 0)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        client = (0, redis_1.createClient)({ url: redisUrl });
                        return [4 /*yield*/, client.connect()];
                    case 2:
                        _a.sent();
                        storeData = {
                            chunks: Array.from(this.chunks.entries()),
                            metadata: {
                                savedAt: new Date().toISOString(),
                                vectorCount: this.chunks.size,
                                dimension: this.chunks.size > 0 ?
                                    this.chunks.values().next().value.embedding.length : 0,
                            },
                        };
                        // Save to Redis
                        return [4 /*yield*/, client.set(this.REDIS_KEY, JSON.stringify(storeData))];
                    case 3:
                        // Save to Redis
                        _a.sent();
                        return [4 /*yield*/, client.disconnect()];
                    case 4:
                        _a.sent();
                        this.lastSaved = new Date();
                        console.log("Saved ".concat(this.chunks.size, " vectors to Redis"));
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Failed to save vector store to Redis:', error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Load from Redis
    VectorStore.prototype.loadFromRedis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var redisUrl, client, data, storeData, chunks, embeddedChunks, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        redisUrl = process.env.REDIS_URL || process.env.KV_URL;
                        if (!redisUrl)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        client = (0, redis_1.createClient)({ url: redisUrl });
                        return [4 /*yield*/, client.connect()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, client.get(this.REDIS_KEY)];
                    case 3:
                        data = _a.sent();
                        return [4 /*yield*/, client.disconnect()];
                    case 4:
                        _a.sent();
                        if (!data)
                            return [2 /*return*/, false];
                        storeData = JSON.parse(String(data));
                        chunks = storeData.chunks;
                        // Clear existing data
                        return [4 /*yield*/, this.clear()];
                    case 5:
                        // Clear existing data
                        _a.sent();
                        if (!(chunks.length > 0)) return [3 /*break*/, 7];
                        embeddedChunks = chunks.map(function (_a) {
                            var _ = _a[0], chunk = _a[1];
                            return chunk;
                        });
                        return [4 /*yield*/, this.add(embeddedChunks)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        this.lastSaved = new Date(storeData.metadata.savedAt);
                        console.log("Loaded ".concat(chunks.length, " vectors from Redis"));
                        return [2 /*return*/, true];
                    case 8:
                        error_2 = _a.sent();
                        console.error('Failed to load vector store from Redis:', error_2);
                        return [2 /*return*/, false];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    // Auto-save scheduling
    VectorStore.prototype.scheduleAutoSave = function () {
        var _this = this;
        this.cancelAutoSave();
        this.autoSaveTimer = setTimeout(function () {
            _this.saveToRedis().catch(console.error);
        }, this.AUTO_SAVE_INTERVAL);
    };
    VectorStore.prototype.cancelAutoSave = function () {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    };
    // Cleanup
    VectorStore.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.cancelAutoSave();
                        return [4 /*yield*/, this.saveToRedis()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.clear()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return VectorStore;
}());
exports.VectorStore = VectorStore;
// Singleton instance
var vectorStoreInstance = null;
function getVectorStore() {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new VectorStore();
    }
    return vectorStoreInstance;
}
