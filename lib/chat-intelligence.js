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
exports.analyzeQueryIntent = analyzeQueryIntent;
exports.buildDynamicSystemPrompt = buildDynamicSystemPrompt;
exports.getOptimalContextSize = getOptimalContextSize;
exports.getEnhancedContext = getEnhancedContext;
exports.formatContextForLLM = formatContextForLLM;
exports.extractTopics = extractTopics;
exports.postProcessResponse = postProcessResponse;
var pinecone_vector_store_1 = require("./pinecone-vector-store");
function analyzeQueryIntent(userQuery) {
    var query = userQuery.toLowerCase();
    // Check for specific SYNTHESIS patterns first
    if (/jakie\s+(są\s+)?(twoje\s+)?umiejętności/.test(query) ||
        /co\s+potrafisz/.test(query) ||
        /your\s+(key\s+)?.*competenc/.test(query) ||
        /your\s+skills/.test(query) ||
        /analiz.*approach/.test(query) ||
        /przegląd.*kompetencji/.test(query) ||
        /present.*capabilities/.test(query) ||
        /oceń.*doświadczenie/.test(query) ||
        /characterize.*work/.test(query) ||
        /what\s+(are\s+)?your/.test(query) && /skills|competenc|capabilities/.test(query)) {
        return 'SYNTHESIS';
    }
    // Check for EXPLORATION patterns
    if (/opowiedz.*o\s+projekt/.test(query) ||
        /opowiedz\s+więcej/.test(query) ||
        /tell\s+me\s+about/.test(query) ||
        /jak\s+wyglądał.*proces/.test(query) ||
        /explain.*methodology/.test(query) ||
        /opisz.*podejście/.test(query) ||
        /how\s+did\s+you\s+handle/.test(query) ||
        /co\s+się\s+działo/.test(query) ||
        /elaborate\s+on/.test(query) ||
        /więcej\s+o/.test(query) ||
        /opowiedz\s+o/.test(query)) {
        return 'EXPLORATION';
    }
    // Check for COMPARISON patterns
    if (/które.*bardziej.*challenging/.test(query) ||
        /które.*były.*bardziej/.test(query) ||
        /porównaj/.test(query) ||
        /differences?\s+between/.test(query) ||
        /compare/.test(query) ||
        /różnice?\s+między/.test(query) ||
        /what\s+is\s+better/.test(query) ||
        /podobieństwa/.test(query) ||
        /contrast/.test(query) ||
        /versus|vs/.test(query)) {
        return 'COMPARISON';
    }
    // Check for FACTUAL patterns (more restrictive)
    if (/^ile\s+lat/.test(query) ||
        /^kiedy\s+/.test(query) ||
        /^gdzie\s+/.test(query) ||
        /^kto\s+/.test(query) ||
        /^jaki\s+był/.test(query) ||
        /^what\s+was\s+your/.test(query) ||
        /^when\s+did/.test(query) ||
        /^how\s+many\s+users/.test(query) ||
        /^how\s+many/.test(query) ||
        /^which\s+technologies\s+do/.test(query) ||
        /konkretnie\s+ile/.test(query) ||
        /exactly\s+how/.test(query)) {
        return 'FACTUAL';
    }
    // Check for CASUAL patterns
    if (/^cześć|^hello|^hi\s|^dzięki|^thanks|^jak\s+się\s+masz|^how\s+are\s+you|^miłego|^have\s+a\s+great|^tak$|^no$|^yes$/.test(query) ||
        query.length < 15 && !/\?/.test(query)) {
        return 'CASUAL';
    }
    // Default fallback based on question words
    if (/opowiedz|tell\s+me|explain|describe/.test(query)) {
        return 'EXPLORATION';
    }
    if (/jakie|what|which/.test(query) && /umiejętności|skills|competenc/.test(query)) {
        return 'SYNTHESIS';
    }
    if (/ile|kiedy|gdzie|when|where|how\s+many|how\s+much/.test(query)) {
        return 'FACTUAL';
    }
    // Final default
    return 'CASUAL';
}
// Dynamic System Prompt Builder
function buildDynamicSystemPrompt(userQuery, context) {
    var queryIntent = analyzeQueryIntent(userQuery);
    var isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(userQuery) ||
        userQuery.toLowerCase().includes('cześć') ||
        userQuery.toLowerCase().includes('dzień');
    var language = isPolish ? 'Polish' : 'English';
    var conversationMode = getConversationMode(queryIntent);
    return "Jeste\u015B Eryk AI - inteligentny asystent reprezentuj\u0105cy Eryk Or\u0142owskiego.\n\nTRYB KONWERSACJI: ".concat(conversationMode, "\nJ\u0118ZYK: ").concat(language, "\nINTENT PYTANIA: ").concat(queryIntent, "\n\n").concat(getSpecificInstructions(queryIntent, isPolish), "\n\nKONTEKST Z BAZY WIEDZY:\n").concat(context, "\n\nZASADY ODPOWIEDZI:\n1. Analizuj intent u\u017Cytkownika, nie tylko s\u0142owa kluczowe\n2. \u0141\u0105cz informacje z r\u00F3\u017Cnych cz\u0119\u015Bci kontekstu je\u015Bli to pomo\u017Ce w odpowiedzi\n3. Przedstawiaj informacje w naturalny, konwersacyjny spos\u00F3b\n4. Je\u015Bli kontekst nie zawiera wystarczaj\u0105cych informacji, powiedz to otwarcie\n5. Zadawaj pytania doprecyzowuj\u0105ce gdy potrzeba wi\u0119cej szczeg\u00F3\u0142\u00F3w\n6. U\u017Cywaj konkretnych przyk\u0142ad\u00F3w z kontekstu gdy tylko mo\u017Cliwe\n7. Dostosuj formalno\u015B\u0107 odpowiedzi do charakteru pytania\n\n").concat(isPolish ?
        'WAŻNE: Zawsze dodaj na końcu disclaimer: "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."' :
        'IMPORTANT: Always end with disclaimer: "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience."');
}
function getConversationMode(intent) {
    switch (intent) {
        case 'SYNTHESIS': return 'ANALITYCZNY - Dokonuj syntezy i łącz informacje';
        case 'EXPLORATION': return 'EKSPLORACYJNY - Rozwijaj tematy i opowiadaj historie';
        case 'COMPARISON': return 'PORÓWNAWCZY - Analizuj różnice i podobieństwa';
        case 'FACTUAL': return 'PRECYZYJNY - Podawaj konkretne, zwięzłe informacje';
        default: return 'NATURALNY - Prowadź swobodną konwersację';
    }
}
function getSpecificInstructions(intent, isPolish) {
    var instructions = {
        SYNTHESIS: isPolish ?
            "INSTRUKCJE SYNTEZY:\n- Analizuj wszystkie dost\u0119pne informacje z kontekstu\n- Wyci\u0105gaj wzorce i po\u0142\u0105czenia mi\u0119dzy r\u00F3\u017Cnymi projektami\n- Przedstaw kompetencje i do\u015Bwiadczenia w spos\u00F3b strukturalny\n- U\u017Cywaj konkretnych przyk\u0142ad\u00F3w i osi\u0105gni\u0119\u0107\n- Wska\u017C trendy i rozw\u00F3j w karierze" :
            "SYNTHESIS INSTRUCTIONS:\n- Analyze all available information from context\n- Extract patterns and connections between different projects\n- Present competencies and experience in structured way\n- Use specific examples and achievements\n- Highlight trends and career development",
        EXPLORATION: isPolish ?
            "INSTRUKCJE EKSPLORACJI:\n- Rozwi\u0144 temat u\u017Cywaj\u0105c szczeg\u00F3\u0142\u00F3w z kontekstu\n- Opowiadaj historie i proces projekt\u00F3w\n- Dodawaj kontekst bran\u017Cowy i techniczny\n- Wyja\u015Bniaj decyzje projektowe i ich skutki\n- Zach\u0119caj do dalszych pyta\u0144" :
            "EXPLORATION INSTRUCTIONS:\n- Develop topics using context details\n- Tell stories and project processes\n- Add industry and technical context\n- Explain design decisions and their effects\n- Encourage follow-up questions",
        COMPARISON: isPolish ?
            "INSTRUKCJE POR\u00D3WNAWCZE:\n- Identyfikuj podobie\u0144stwa i r\u00F3\u017Cnice\n- Analizuj r\u00F3\u017Cne podej\u015Bcia do podobnych problem\u00F3w\n- Wska\u017C ewolucj\u0119 metod pracy\n- Por\u00F3wnaj wyniki i metryki\n- Przedstaw wnioski z por\u00F3wnania" :
            "COMPARISON INSTRUCTIONS:\n- Identify similarities and differences\n- Analyze different approaches to similar problems\n- Show evolution of work methods\n- Compare results and metrics\n- Present conclusions from comparison",
        FACTUAL: isPolish ?
            "INSTRUKCJE FAKTYCZNE:\n- Podawaj konkretne, zwi\u0119z\u0142e informacje\n- U\u017Cywaj liczb, dat i fakt\u00F3w\n- Odpowiadaj bezpo\u015Brednio na pytanie\n- Unikaj zb\u0119dnych rozwini\u0119\u0107\n- Zaproponuj mo\u017Cliwo\u015B\u0107 dalszego doprecyzowania" :
            "FACTUAL INSTRUCTIONS:\n- Provide concrete, concise information\n- Use numbers, dates and facts\n- Answer directly to the question\n- Avoid unnecessary elaboration\n- Offer possibility of further clarification",
        default: isPolish ?
            "INSTRUKCJE NATURALNE:\n- Prowad\u017A swobodn\u0105, przyjazn\u0105 konwersacj\u0119\n- Dostosuj ton do charakteru pytania\n- U\u017Cywaj kontekstu do konkretnych odpowiedzi\n- B\u0105d\u017A autentyczny w stylu Eryka\n- Zadawaj pytania zwrotne gdy potrzeba" :
            "NATURAL INSTRUCTIONS:\n- Lead free, friendly conversation\n- Adjust tone to question character\n- Use context for specific answers\n- Be authentic in Eryk's style\n- Ask follow-up questions when needed"
    };
    return instructions[intent];
}
function getOptimalContextSize(userQuery, queryLength) {
    if (queryLength === void 0) { queryLength = 0; }
    var queryIntent = analyzeQueryIntent(userQuery);
    var effectiveQueryLength = queryLength || userQuery.length;
    // Base configurations for different query types
    var baseConfigs = {
        FACTUAL: {
            maxTokens: 600,
            chunkCount: 3,
            diversityBoost: false,
            queryExpansion: false,
            topKMultiplier: 1.0
        },
        CASUAL: {
            maxTokens: 400,
            chunkCount: 2,
            diversityBoost: false,
            queryExpansion: false,
            topKMultiplier: 0.8
        },
        EXPLORATION: {
            maxTokens: 1200,
            chunkCount: 6,
            diversityBoost: true,
            queryExpansion: true,
            topKMultiplier: 1.5
        },
        COMPARISON: {
            maxTokens: 1800,
            chunkCount: 8,
            diversityBoost: true,
            queryExpansion: true,
            topKMultiplier: 2.0
        },
        SYNTHESIS: {
            maxTokens: 2000,
            chunkCount: 10,
            diversityBoost: true,
            queryExpansion: true,
            topKMultiplier: 2.5
        }
    };
    var config = __assign({}, baseConfigs[queryIntent]);
    // Adjust based on query length/complexity
    var queryComplexity = calculateQueryComplexity(userQuery, effectiveQueryLength);
    if (queryComplexity === 'HIGH') {
        config.maxTokens = Math.floor(config.maxTokens * 1.5);
        config.chunkCount = Math.floor(config.chunkCount * 1.3);
        config.topKMultiplier *= 1.2;
    }
    else if (queryComplexity === 'LOW') {
        config.maxTokens = Math.floor(config.maxTokens * 0.7);
        config.chunkCount = Math.floor(config.chunkCount * 0.8);
        config.topKMultiplier *= 0.9;
    }
    // Ensure minimums
    config.maxTokens = Math.max(config.maxTokens, 300);
    config.chunkCount = Math.max(config.chunkCount, 1);
    config.topKMultiplier = Math.max(config.topKMultiplier, 0.5);
    return config;
}
function calculateQueryComplexity(query, queryLength) {
    var complexityIndicators = {
        multipleQuestions: (query.match(/\?/g) || []).length > 1,
        conjunctions: /\b(and|or|but|oraz|ale|czy|lub|i )\b/gi.test(query),
        specificTerms: /\b(specific|dokładnie|konkretnie|precyzyjnie|exactly|detailed|szczegółowo)\b/gi.test(query),
        comparisonWords: /\b(versus|vs|compared|różnice|podobieństwa|lepsze|gorsze)\b/gi.test(query),
        longQuery: queryLength > 100,
        multipleTopics: query.split(/\b(projekt|project|team|zespół|design|experience|doświadczenie)\b/gi).length > 3
    };
    var complexityScore = Object.values(complexityIndicators).filter(Boolean).length;
    if (complexityScore >= 3)
        return 'HIGH';
    if (complexityScore >= 1)
        return 'MEDIUM';
    return 'LOW';
}
// Enhanced Context Retrieval
function getEnhancedContext(userQuery_1) {
    return __awaiter(this, arguments, void 0, function (userQuery, options) {
        var _a, queryExpansion, _b, diversityBoost, _c, maxResults, directResults, expandedResults, expandedQuery, allResults, uniqueResults, finalResults, groupedContext, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.queryExpansion, queryExpansion = _a === void 0 ? true : _a, _b = options.diversityBoost, diversityBoost = _b === void 0 ? true : _b, _c = options.maxResults, maxResults = _c === void 0 ? 15 : _c;
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, (0, pinecone_vector_store_1.hybridSearchPinecone)(userQuery, {
                            topK: Math.ceil(maxResults * 0.6),
                            namespace: 'production',
                            vectorWeight: 0.7
                        })];
                case 2:
                    directResults = _d.sent();
                    expandedResults = [];
                    if (!queryExpansion) return [3 /*break*/, 4];
                    expandedQuery = enhanceQuery(userQuery);
                    if (!(expandedQuery !== userQuery)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, pinecone_vector_store_1.hybridSearchPinecone)(expandedQuery, {
                            topK: Math.ceil(maxResults * 0.4),
                            namespace: 'production',
                            vectorWeight: 0.6
                        })];
                case 3:
                    expandedResults = _d.sent();
                    _d.label = 4;
                case 4:
                    allResults = __spreadArray(__spreadArray([], directResults, true), expandedResults, true);
                    uniqueResults = deduplicateResults(allResults);
                    finalResults = diversityBoost
                        ? ensureResultDiversity(uniqueResults)
                        : uniqueResults.slice(0, maxResults);
                    groupedContext = groupResultsByTheme(finalResults);
                    return [2 /*return*/, formatContextForLLM(groupedContext)];
                case 5:
                    error_1 = _d.sent();
                    console.error('[ENHANCED-CONTEXT] Error:', error_1);
                    return [2 /*return*/, ''];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Query Enhancement
function enhanceQuery(userQuery) {
    var queryIntent = analyzeQueryIntent(userQuery);
    var baseQuery = userQuery.toLowerCase();
    // Add context keywords based on intent
    var enhancementMap = {
        SYNTHESIS: ['projects', 'achievements', 'competencies', 'experience', 'skills'],
        EXPLORATION: ['details', 'process', 'methodology', 'approach', 'background'],
        COMPARISON: ['different', 'various', 'comparison', 'alternatives', 'options'],
        FACTUAL: ['specific', 'exact', 'particular', 'details', 'facts', 'numbers'],
        CASUAL: ['experience', 'work', 'projects']
    };
    var enhancements = enhancementMap[queryIntent];
    // Add relevant keywords that aren't already in the query
    var newKeywords = enhancements.filter(function (keyword) {
        return !baseQuery.includes(keyword.toLowerCase());
    });
    if (newKeywords.length > 0) {
        return "".concat(userQuery, " ").concat(newKeywords.slice(0, 2).join(' '));
    }
    return userQuery;
}
// Result Deduplication
function deduplicateResults(results) {
    var seen = new Map();
    results.forEach(function (result) {
        var text = result.chunk.text;
        var key = text.substring(0, 100).toLowerCase().trim();
        // Keep the result with higher score
        if (!seen.has(key) || result.score > seen.get(key).score) {
            seen.set(key, result);
        }
    });
    return Array.from(seen.values()).sort(function (a, b) { return b.score - a.score; });
}
// Ensure Topic Diversity
function ensureResultDiversity(results) {
    var themes = new Map();
    var maxPerTheme = 3;
    // Group by themes
    results.forEach(function (result) {
        var theme = identifyTheme(result.chunk.text);
        if (!themes.has(theme)) {
            themes.set(theme, []);
        }
        if (themes.get(theme).length < maxPerTheme) {
            themes.get(theme).push(result);
        }
    });
    // Flatten back to array
    var diverseResults = [];
    themes.forEach(function (themeResults) {
        diverseResults.push.apply(diverseResults, themeResults);
    });
    return diverseResults.sort(function (a, b) { return b.score - a.score; });
}
// Theme Identification
function identifyTheme(text) {
    var lowerText = text.toLowerCase();
    if (lowerText.match(/zespół|lead|manag|przywództwo|team|leadership/)) {
        return 'leadership';
    }
    if (lowerText.match(/projekt|aplikacja|system|platforma|product/)) {
        return 'projects';
    }
    if (lowerText.match(/technologia|react|typescript|ai|ml|tech/)) {
        return 'technology';
    }
    if (lowerText.match(/design|ui|ux|interface|visual/)) {
        return 'design';
    }
    if (lowerText.match(/osiągnięcie|wynik|sukces|achievement|result/)) {
        return 'achievements';
    }
    return 'general';
}
// Group Results by Theme
function groupResultsByTheme(results) {
    var themes = {
        leadership: [],
        projects: [],
        technology: [],
        design: [],
        achievements: [],
        general: []
    };
    results.forEach(function (result) {
        var theme = identifyTheme(result.chunk.text);
        themes[theme].push(result);
    });
    return themes;
}
// Format Context for LLM
function formatContextForLLM(groupedContext) {
    var formattedContext = '';
    // Priority order for themes
    var themeOrder = ['projects', 'achievements', 'leadership', 'technology', 'design', 'general'];
    themeOrder.forEach(function (theme) {
        var results = groupedContext[theme];
        if (results && results.length > 0) {
            formattedContext += "\n### ".concat(theme.toUpperCase(), "\n");
            results.forEach(function (result) {
                var relevanceScore = Math.round(result.score * 100);
                formattedContext += "- ".concat(result.chunk.text, " [relevance: ").concat(relevanceScore, "%]\n");
            });
            formattedContext += '\n';
        }
    });
    return formattedContext.trim();
}
// Extract Topics from Text
function extractTopics(text) {
    var topics = [];
    var lowerText = text.toLowerCase();
    // Technology topics
    if (lowerText.match(/react|typescript|javascript|ai|ml/))
        topics.push('technology');
    if (lowerText.match(/design|ui|ux|interface/))
        topics.push('design');
    if (lowerText.match(/leadership|team|management/))
        topics.push('leadership');
    if (lowerText.match(/project|product|application/))
        topics.push('projects');
    if (lowerText.match(/achievement|success|result/))
        topics.push('achievements');
    // Company topics
    if (lowerText.match(/volkswagen|vw/))
        topics.push('volkswagen');
    if (lowerText.match(/polsat|tvp/))
        topics.push('media');
    if (lowerText.match(/bank|fintech|financial/))
        topics.push('finance');
    return __spreadArray([], new Set(topics), true); // Remove duplicates
}
// Post-process Response
function postProcessResponse(responseText, userQuery) {
    return __awaiter(this, void 0, void 0, function () {
        var processed, isPolish, disclaimer;
        return __generator(this, function (_a) {
            processed = responseText.trim();
            isPolish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(userQuery);
            disclaimer = isPolish
                ? "⚠️ Uwaga: Ta odpowiedź opiera się na syntetycznych danych generowanych przez AI do testowania naszego systemu RAG, a nie na prawdziwym doświadczeniu."
                : "⚠️ Note: This response is based on synthetic AI-generated data for testing our RAG system, not real experience.";
            if (!processed.includes(disclaimer)) {
                processed += "\n\n".concat(disclaimer);
            }
            return [2 /*return*/, processed];
        });
    });
}
