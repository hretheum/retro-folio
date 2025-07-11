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
exports.pinecone = void 0;
exports.getPineconeIndex = getPineconeIndex;
exports.chunksToPineconeRecords = chunksToPineconeRecords;
exports.upsertEmbeddings = upsertEmbeddings;
exports.searchSimilar = searchSimilar;
exports.clearNamespace = clearNamespace;
exports.getIndexStats = getIndexStats;
var pinecone_1 = require("@pinecone-database/pinecone");
// Initialize Pinecone client
exports.pinecone = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
// Get or create index
function getPineconeIndex() {
    return __awaiter(this, arguments, void 0, function (indexName) {
        if (indexName === void 0) { indexName = 'retro-folio'; }
        return __generator(this, function (_a) {
            // Index already exists, just return it
            return [2 /*return*/, exports.pinecone.index(indexName)];
        });
    });
}
// Convert our chunks to Pinecone format
function chunksToPineconeRecords(chunks) {
    return chunks.map(function (chunk) {
        // Log first chunk for debugging
        if (chunk.id.endsWith('-chunk-0')) {
            console.log('[chunksToPineconeRecords] First chunk sample:', {
                id: chunk.id,
                textLength: chunk.text.length,
                textPreview: chunk.text.substring(0, 150),
                metadata: chunk.metadata
            });
        }
        return {
            id: chunk.id,
            values: chunk.embedding,
            metadata: __assign({ text: chunk.text, contentId: chunk.metadata.contentId, contentType: chunk.metadata.contentType, chunkIndex: chunk.metadata.chunkIndex, totalChunks: chunk.metadata.totalChunks }, chunk.metadata),
        };
    });
}
// Upsert embeddings to Pinecone
function upsertEmbeddings(chunks_1) {
    return __awaiter(this, arguments, void 0, function (chunks, namespace) {
        var index, records, batchSize, i, batch;
        if (namespace === void 0) { namespace = 'default'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPineconeIndex()];
                case 1:
                    index = _a.sent();
                    records = chunksToPineconeRecords(chunks);
                    batchSize = 100;
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < records.length)) return [3 /*break*/, 5];
                    batch = records.slice(i, i + batchSize);
                    return [4 /*yield*/, index.namespace(namespace).upsert(batch)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i += batchSize;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Search similar vectors
function searchSimilar(queryEmbedding_1) {
    return __awaiter(this, arguments, void 0, function (queryEmbedding, options) {
        var _a, topK, _b, namespace, filter, _c, includeMetadata, index, queryResponse;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.topK, topK = _a === void 0 ? 5 : _a, _b = options.namespace, namespace = _b === void 0 ? 'default' : _b, filter = options.filter, _c = options.includeMetadata, includeMetadata = _c === void 0 ? true : _c;
                    return [4 /*yield*/, getPineconeIndex()];
                case 1:
                    index = _d.sent();
                    return [4 /*yield*/, index.namespace(namespace).query({
                            vector: queryEmbedding,
                            topK: topK,
                            filter: filter,
                            includeMetadata: includeMetadata,
                        })];
                case 2:
                    queryResponse = _d.sent();
                    return [2 /*return*/, queryResponse.matches || []];
            }
        });
    });
}
// Delete all vectors in a namespace
function clearNamespace() {
    return __awaiter(this, arguments, void 0, function (namespace) {
        var index;
        if (namespace === void 0) { namespace = 'default'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPineconeIndex()];
                case 1:
                    index = _a.sent();
                    return [4 /*yield*/, index.namespace(namespace).deleteAll()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Get index stats
function getIndexStats() {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPineconeIndex()];
                case 1:
                    index = _a.sent();
                    return [2 /*return*/, index.describeIndexStats()];
            }
        });
    });
}
