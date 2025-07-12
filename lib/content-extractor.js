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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllCMSContent = fetchAllCMSContent;
exports.normalizeContent = normalizeContent;
var redis_1 = require("redis");
// Helper to normalize and combine content fields
function extractTextContent(item, type) {
    var _a, _b, _c;
    var parts = [];
    switch (type) {
        case 'work':
            parts.push(item.companyTitle || '');
            parts.push(item.position || '');
            parts.push(item.description || '');
            if ((_a = item.insights) === null || _a === void 0 ? void 0 : _a.length) {
                parts.push.apply(parts, item.insights);
            }
            break;
        case 'timeline':
            parts.push(item.title || '');
            parts.push(item.label || '');
            parts.push(item.content || '');
            break;
        case 'experiment':
            parts.push(item.title || '');
            parts.push(item.description || '');
            if ((_b = item.learnings) === null || _b === void 0 ? void 0 : _b.length) {
                parts.push.apply(parts, __spreadArray(['Learnings:'], item.learnings, false));
            }
            break;
        case 'leadership':
            parts.push(item.title || '');
            parts.push(item.value || '');
            parts.push(item.description || '');
            if ((_c = item.examples) === null || _c === void 0 ? void 0 : _c.length) {
                parts.push.apply(parts, __spreadArray(['Examples:'], item.examples, false));
            }
            break;
        case 'contact':
            parts.push(item.label || '');
            parts.push(item.value || '');
            parts.push(item.description || '');
            break;
    }
    return parts.filter(Boolean).join(' ');
}
// Extract metadata based on content type
function extractMetadata(item, type) {
    var metadata = {};
    if (item.date)
        metadata.date = item.date;
    if (item.tags)
        metadata.tags = Array.isArray(item.tags) ? item.tags : [item.tags];
    if (item.technologies)
        metadata.technologies = item.technologies;
    if (item.featured !== undefined)
        metadata.featured = item.featured;
    if (item.link || item.url)
        metadata.url = item.link || item.url;
    if (item.role)
        metadata.role = item.role;
    // Type-specific metadata
    switch (type) {
        case 'experiment':
            if (item.status)
                metadata.tags = __spreadArray(__spreadArray([], (metadata.tags || []), true), [item.status], false);
            break;
        case 'leadership':
            if (item.category)
                metadata.tags = __spreadArray(__spreadArray([], (metadata.tags || []), true), [item.category], false);
            break;
    }
    return metadata;
}
// Fetch all content from Redis/localStorage
function fetchAllCMSContent() {
    return __awaiter(this, void 0, void 0, function () {
        var contentTypes, allContent, redisUrl, client, _i, contentTypes_1, type, key, data, items, _a, items_1, item, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    contentTypes = ['work', 'timeline', 'experiment', 'leadership', 'contact'];
                    allContent = [];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 9, , 10]);
                    redisUrl = process.env.REDIS_URL || process.env.KV_URL;
                    if (!redisUrl) return [3 /*break*/, 8];
                    client = (0, redis_1.createClient)({ url: redisUrl });
                    return [4 /*yield*/, client.connect()];
                case 2:
                    _b.sent();
                    _i = 0, contentTypes_1 = contentTypes;
                    _b.label = 3;
                case 3:
                    if (!(_i < contentTypes_1.length)) return [3 /*break*/, 6];
                    type = contentTypes_1[_i];
                    key = "content:".concat(type);
                    return [4 /*yield*/, client.get(key)];
                case 4:
                    data = _b.sent();
                    if (data) {
                        items = JSON.parse(String(data));
                        for (_a = 0, items_1 = items; _a < items_1.length; _a++) {
                            item = items_1[_a];
                            allContent.push({
                                id: "".concat(type, "-").concat(item.id || Date.now()),
                                type: type,
                                title: item.title || item.companyTitle || item.label || 'Untitled',
                                content: extractTextContent(item, type),
                                metadata: extractMetadata(item, type),
                            });
                        }
                    }
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, client.disconnect()];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _b.sent();
                    console.error('Error fetching from Redis:', error_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, allContent];
            }
        });
    });
}
// Normalize and prepare content for processing
function normalizeContent(content) {
    return content.map(function (item) {
        // Ensure content is not empty
        var cleanContent = (item.content || item.title).trim().replace(/\s+/g, ' ');
        return __assign(__assign({}, item), { title: item.title.trim(), content: cleanContent });
    }).filter(function (item) { return item.content.length > 10; }); // Filter out too short content
}
