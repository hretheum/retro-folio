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
exports.chunkText = chunkText;
exports.chunkContent = chunkContent;
exports.chunkContents = chunkContents;
var openai_1 = require("./openai");
var DEFAULT_OPTIONS = {
    maxTokens: 512,
    overlap: 50,
    preserveSentences: true,
};
// Split text into sentences
function splitIntoSentences(text) {
    // Regex to match sentence boundaries
    var sentenceRegex = /[.!?]+[\s]+|[.!?]+$/g;
    var sentences = [];
    var lastIndex = 0;
    var match;
    while ((match = sentenceRegex.exec(text)) !== null) {
        var sentence = text.slice(lastIndex, match.index + match[0].length).trim();
        if (sentence.length > 0) {
            sentences.push(sentence);
        }
        lastIndex = match.index + match[0].length;
    }
    // Add any remaining text
    if (lastIndex < text.length) {
        var remaining = text.slice(lastIndex).trim();
        if (remaining.length > 0) {
            sentences.push(remaining);
        }
    }
    return sentences;
}
// Create chunks with overlap
function createChunksWithOverlap(sentences, maxTokens, overlap) {
    var chunks = [];
    var currentChunk = [];
    var currentTokens = 0;
    var overlapBuffer = [];
    for (var i = 0; i < sentences.length; i++) {
        var sentence = sentences[i];
        var sentenceTokens = (0, openai_1.estimateTokens)(sentence);
        // If single sentence exceeds max tokens, split it
        if (sentenceTokens > maxTokens) {
            // Save current chunk if it has content
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
                // Prepare overlap for next chunk
                overlapBuffer = currentChunk.slice(-Math.ceil(currentChunk.length / 3));
                currentChunk = [];
                currentTokens = 0;
            }
            // Split long sentence by words
            var words = sentence.split(' ');
            var wordChunk = [];
            var wordTokens = 0;
            for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
                var word = words_1[_i];
                var wordTokenCount = (0, openai_1.estimateTokens)(word + ' ');
                if (wordTokens + wordTokenCount > maxTokens && wordChunk.length > 0) {
                    chunks.push(wordChunk.join(' '));
                    wordChunk = [word];
                    wordTokens = wordTokenCount;
                }
                else {
                    wordChunk.push(word);
                    wordTokens += wordTokenCount;
                }
            }
            if (wordChunk.length > 0) {
                currentChunk = wordChunk;
                currentTokens = wordTokens;
            }
        }
        else if (currentTokens + sentenceTokens > maxTokens) {
            // Current chunk is full, save it
            chunks.push(currentChunk.join(' '));
            // Start new chunk with overlap
            overlapBuffer = [];
            var overlapTokens = 0;
            // Add sentences from the end of current chunk for overlap
            for (var j = currentChunk.length - 1; j >= 0 && overlapTokens < overlap; j--) {
                var overlapSentence = currentChunk[j];
                var overlapSentenceTokens = (0, openai_1.estimateTokens)(overlapSentence);
                if (overlapTokens + overlapSentenceTokens <= overlap) {
                    overlapBuffer.unshift(overlapSentence);
                    overlapTokens += overlapSentenceTokens;
                }
            }
            currentChunk = __spreadArray(__spreadArray([], overlapBuffer, true), [sentence], false);
            currentTokens = overlapTokens + sentenceTokens;
        }
        else {
            // Add sentence to current chunk
            currentChunk.push(sentence);
            currentTokens += sentenceTokens;
        }
    }
    // Add final chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}
// Main chunking function
function chunkText(text, options) {
    if (options === void 0) { options = {}; }
    var opts = __assign(__assign({}, DEFAULT_OPTIONS), options);
    if (!text || text.trim().length === 0) {
        return [];
    }
    // If text is already small enough, return as single chunk
    var totalTokens = (0, openai_1.estimateTokens)(text);
    if (totalTokens <= opts.maxTokens) {
        return [{ text: text.trim(), tokens: totalTokens }];
    }
    // Split into sentences if preserving sentences
    var sentences = opts.preserveSentences
        ? splitIntoSentences(text)
        : [text];
    // Create chunks with overlap
    var chunkTexts = createChunksWithOverlap(sentences, opts.maxTokens, opts.overlap);
    // Calculate tokens for each chunk
    return chunkTexts.map(function (chunkText) { return ({
        text: chunkText,
        tokens: (0, openai_1.estimateTokens)(chunkText),
    }); });
}
// Process ExtractedContent into chunks
function chunkContent(content, options) {
    if (options === void 0) { options = {}; }
    var textChunks = chunkText(content.content, options);
    return textChunks.map(function (chunk, index) { return ({
        id: "".concat(content.id, "-chunk-").concat(index),
        text: chunk.text,
        metadata: __assign(__assign({}, content.metadata), { contentId: content.id, contentType: content.type, chunkIndex: index, totalChunks: textChunks.length }),
        tokens: chunk.tokens,
    }); });
}
// Process multiple contents into chunks
function chunkContents(contents, options) {
    if (options === void 0) { options = {}; }
    var allChunks = [];
    for (var _i = 0, contents_1 = contents; _i < contents_1.length; _i++) {
        var content = contents_1[_i];
        var chunks = chunkContent(content, options);
        allChunks.push.apply(allChunks, chunks);
    }
    return allChunks;
}
