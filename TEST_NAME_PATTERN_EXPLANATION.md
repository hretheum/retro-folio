# Dopasowanie Nazw Testów (Test Name Pattern Matching) - Wyjaśnienie

## 🎯 **Co to dokładnie znaczy?**

Dopasowanie nazw testów to mechanizm, który pozwala **uruchamiać tylko wybrane testy** na podstawie ich nazw, używając wzorców regex.

## 🔍 **Jak to działa w praktyce?**

### 1. **Struktura Nazw Testów**

W naszym systemie testy mają nazwy według wzorca:
```typescript
describe('Rate Limiter', () => {
  test('should handle rate limit exceeded', async () => {
    // Test logic
  });
  
  test('should create rate limiter', async () => {
    // Test logic  
  });
});
```

### 2. **Pattern Matching Command**

```bash
npm test -- --testNamePattern="should handle.*rate"
```

**Co to robi:**
- `should handle.*rate` - wzorzec regex
- `.*` - dopasowuje dowolne znaki między "should handle" a "rate"
- Uruchamia **TYLKO** testy, których nazwy pasują do wzorca

### 3. **Konkretny Przykład z Naszego Systemu**

Kiedy uruchamiamy:
```bash
npm test -- --testNamePattern="should handle.*rate"
```

**Znaleziony test:**
```typescript
// W pliku: lib/rate-limiting/__tests__/rate-limiter.test.ts
test('should handle rate limit exceeded', async () => {
  // ✅ PASUJE do wzorca "should handle.*rate"
  // "should handle" + "rate limit exceeded" zawiera "rate"
});
```

**Inne testy w tym pliku:**
```typescript
test('should create rate limiter', async () => {
  // ❌ NIE PASUJE - brak "should handle" na początku
});

test('should create limiter with config', async () => {
  // ❌ NIE PASUJE - brak "should handle" na początku
});
```

## 📊 **Wyniki Pattern Matching**

Z naszego testu widać, że wzorzec `"should handle.*rate"` znalazł:

### **Uruchomione pliki testowe:**
- `lib/rate-limiting/__tests__/rate-limiter.test.ts` ✅
- `lib/__tests__/unified-intelligent-chat.test.ts` ✅  
- `lib/__tests__/context-cache.test.ts` ✅
- `src/components/__tests__/ErykChat.test.tsx` ✅

### **Konkretne testy, które pasują:**
```typescript
// 1. Rate Limiter
test('should handle rate limit exceeded') // ✅ PASUJE

// 2. W innych plikach mogą być testy jak:
test('should handle rate limiting gracefully') // ✅ PASUJE
test('should handle rate exceeded scenarios') // ✅ PASUJE
```

## 🔧 **Różne Wzorce Pattern Matching**

### **1. Wzorce dla Rate Limiting**
```bash
# Wszystkie testy rate limiting
--testNamePattern="rate"

# Tylko testy obsługi rate limiting
--testNamePattern="should handle.*rate"

# Konkretne scenariusze
--testNamePattern="rate limit exceeded"
```

### **2. Wzorce dla Hierarchical Classification**
```bash
# Wszystkie testy klasyfikacji
--testNamePattern="should classify.*intent"

# Testy hierarchii
--testNamePattern="hierarchical.*classification"

# Testy poziomów
--testNamePattern="level.*intent"
```

### **3. Wzorce dla Context Management**
```bash
# Wszystkie testy pamięci
--testNamePattern="should manage.*context"

# Testy konkretnych typów pamięci
--testNamePattern="working.*memory"
--testNamePattern="episodic.*memory"
```

## 🎯 **Praktyczne Zastosowania**

### **1. GitHub Actions**
```yaml
- name: Run Rate Limiting Tests
  run: |
    npm test -- --testPathPattern="rate-limiting" --testNamePattern="should handle.*rate.*limit"
```

**Co to robi:**
- `--testPathPattern="rate-limiting"` - tylko pliki z "rate-limiting" w ścieżce
- `--testNamePattern="should handle.*rate.*limit"` - tylko testy o nazwach pasujących do wzorca

### **2. Debugging Konkretnych Problemów**
```bash
# Tylko testy błędów
npm test -- --testNamePattern="should handle.*error"

# Tylko testy failures
npm test -- --testNamePattern="should handle.*fail"

# Tylko testy graceful handling
npm test -- --testNamePattern="gracefully"
```

### **3. Feature-Specific Testing**
```bash
# Wszystkie testy FACTUAL queries
npm test -- --testNamePattern="FACTUAL"

# Wszystkie testy SYNTHESIS queries  
npm test -- --testNamePattern="SYNTHESIS"

# Wszystkie testy query types
npm test -- --testNamePattern="should handle.*queries"
```

## 📈 **Przykłady z Naszego Systemu**

### **Znalezione testy dla "should handle.*rate":**

```typescript
// lib/rate-limiting/__tests__/rate-limiter.test.ts
✅ "should handle rate limit exceeded"

// Inne pliki mogą zawierać:
✅ "should handle rate limiting gracefully"
✅ "should handle rate exceeded scenarios"  
✅ "should handle rate configuration"
```

### **Pominięte testy:**
```typescript
❌ "should create rate limiter"           // Brak "handle"
❌ "should configure rate limiting"       // Brak "handle"
❌ "rate limiting should work"            // Nieprawidłowa kolejność słów
```

## 🚀 **Zalety Pattern Matching**

### **1. Precyzyjne Testowanie**
- Uruchamiasz tylko to, co potrzebujesz
- Szybsze debugowanie
- Fokus na konkretnych problemach

### **2. CI/CD Optimization**
- Równoległe uruchamianie różnych grup testów
- Szybsze feedback loops
- Lepsze wykorzystanie zasobów

### **3. Development Workflow**
- Testowanie konkretnych features
- Debugging specific scenarios
- Iterative development

## 🔄 **Regex Patterns Explained**

```bash
# Podstawowe wzorce
"should handle.*rate"        # "should handle" + cokolwiek + "rate"
"should.*handle.*rate"       # "should" + cokolwiek + "handle" + cokolwiek + "rate"
"^should handle"             # Zaczyna się od "should handle"
"rate.*exceeded$"            # Kończy się na "rate" + cokolwiek + "exceeded"

# Zaawansowane wzorce
"should handle.*(rate|limit)" # "should handle" + ("rate" LUB "limit")
"should handle.*rate.*limit"  # "should handle" + "rate" + "limit"
```

## 💡 **Najlepsze Praktyki**

### **1. Konsystentne Nazewnictwo**
```typescript
// ✅ DOBRZE
test('should handle rate limit exceeded')
test('should handle rate limit configuration')
test('should handle rate limit reset')

// ❌ ŹLE  
test('rate limit handling')
test('test rate limits')
test('rate limiting works')
```

### **2. Hierarchiczne Grupowanie**
```typescript
describe('Rate Limiter', () => {
  describe('Error Handling', () => {
    test('should handle rate limit exceeded')
    test('should handle connection errors')
  });
  
  describe('Configuration', () => {
    test('should handle rate limit config')
  });
});
```

### **3. Pattern-Friendly Naming**
```typescript
// Umożliwia łatwe filtrowanie
test('should handle FACTUAL queries')
test('should handle SYNTHESIS queries')
test('should handle EXPLORATION queries')

// Wzorzec: --testNamePattern="should handle.*queries"
```

To jest dokładnie to, jak działa dopasowanie nazw testów - to potężne narzędzie do selektywnego uruchamiania testów na podstawie ich nazw przy użyciu wzorców regex!