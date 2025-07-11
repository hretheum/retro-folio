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
exports.generateEmbeddings = generateEmbeddings;
exports.generateQueryEmbedding = generateQueryEmbedding;
var openai_1 = require("./openai");
// Batch configuration
var BATCH_SIZE = 100;
var RETRY_ATTEMPTS = 3;
var RETRY_DELAY = 1000; // 1 second
// Cost estimation (as of 2024)
var COST_PER_1K_TOKENS = 0.00002; // $0.00002 per 1K tokens for text-embedding-3-small
// Helper to sleep
var sleep = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
// Retry wrapper for API calls
function retryWithBackoff(fn_1) {
    return __awaiter(this, arguments, void 0, function (fn, attempts) {
        var i, error_1;
        if (attempts === void 0) { attempts = RETRY_ATTEMPTS; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < attempts)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    if (i === attempts - 1)
                        throw error_1;
                    return [4 /*yield*/, sleep(RETRY_DELAY * Math.pow(2, i))];
                case 5:
                    _a.sent(); // Exponential backoff
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw new Error('Max retry attempts reached');
            }
        });
    });
}
// Generate embedding for a single text
function generateEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openai_1.openai.embeddings.create({
                        model: openai_1.AI_MODELS.embedding,
                        input: text,
                        dimensions: 1024, // Match Pinecone index dimension
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data[0].embedding];
            }
        });
    });
}
// Generate embeddings for a batch of chunks
function generateBatchEmbeddings(chunks, onProgress) {
    return __awaiter(this, void 0, void 0, function () {
        var embeddings, failedChunks, totalBatches, batchIndex, batchStart, batchEnd, batch, batchPromises;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    embeddings = new Map();
                    failedChunks = new Set();
                    totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
                    batchIndex = 0;
                    _a.label = 1;
                case 1:
                    if (!(batchIndex < totalBatches)) return [3 /*break*/, 5];
                    batchStart = batchIndex * BATCH_SIZE;
                    batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
                    batch = chunks.slice(batchStart, batchEnd);
                    // Report progress
                    if (onProgress) {
                        onProgress({
                            processed: batchStart,
                            total: chunks.length,
                            failed: failedChunks.size,
                            currentBatch: batchIndex + 1,
                            totalBatches: totalBatches,
                        });
                    }
                    batchPromises = batch.map(function (chunk) { return __awaiter(_this, void 0, void 0, function () {
                        var embedding, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, retryWithBackoff(function () { return generateEmbedding(chunk.text); })];
                                case 1:
                                    embedding = _a.sent();
                                    embeddings.set(chunk.id, embedding);
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_2 = _a.sent();
                                    console.error("Failed to generate embedding for chunk ".concat(chunk.id, ":"), error_2);
                                    failedChunks.add(chunk.id);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(batchPromises)];
                case 2:
                    _a.sent();
                    if (!(batchIndex < totalBatches - 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, sleep(100)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    batchIndex++;
                    return [3 /*break*/, 1];
                case 5:
                    // Final progress report
                    if (onProgress) {
                        onProgress({
                            processed: chunks.length,
                            total: chunks.length,
                            failed: failedChunks.size,
                            currentBatch: totalBatches,
                            totalBatches: totalBatches,
                        });
                    }
                    return [2 /*return*/, embeddings];
            }
        });
    });
}
// Main function to generate embeddings for chunks
function generateEmbeddings(chunks, onProgress) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, embeddingMap, embeddedChunks, failedChunks, _i, chunks_1, chunk, embedding, totalTokens, totalCost, duration, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generateBatchEmbeddings(chunks, onProgress)];
                case 2:
                    embeddingMap = _a.sent();
                    embeddedChunks = [];
                    failedChunks = [];
                    for (_i = 0, chunks_1 = chunks; _i < chunks_1.length; _i++) {
                        chunk = chunks_1[_i];
                        embedding = embeddingMap.get(chunk.id);
                        if (embedding) {
                            embeddedChunks.push(__assign(__assign({}, chunk), { embedding: embedding }));
                        }
                        else {
                            failedChunks.push(chunk);
                        }
                    }
                    totalTokens = chunks.reduce(function (sum, chunk) { return sum + chunk.tokens; }, 0);
                    totalCost = (totalTokens / 1000) * COST_PER_1K_TOKENS;
                    duration = Date.now() - startTime;
                    return [2 /*return*/, {
                            success: failedChunks.length === 0,
                            embeddings: embeddedChunks,
                            stats: {
                                processedChunks: embeddedChunks.length,
                                failedChunks: failedChunks.length,
                                totalCost: totalCost,
                                duration: duration,
                            },
                        }];
                case 3:
                    error_3 = _a.sent();
                    console.error('Embedding generation failed:', error_3);
                    return [2 /*return*/, {
                            success: false,
                            embeddings: [],
                            stats: {
                                processedChunks: 0,
                                failedChunks: chunks.length,
                                totalCost: 0,
                                duration: Date.now() - startTime,
                            },
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Generate embedding for a query
function generateQueryEmbedding(query) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, retryWithBackoff(function () { return generateEmbedding(query); })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_4 = _a.sent();
                    console.error('Failed to generate query embedding:', error_4);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
