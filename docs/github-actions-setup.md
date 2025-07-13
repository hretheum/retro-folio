# GitHub Actions Setup with Real API Testing

## Overview

Ten workflow testuje realne działanie aplikacji z kluczami API w środowisku CI/CD.

## Konfiguracja Secrets

### 1. Dodaj Secrets w GitHub Repository

Przejdź do: `Settings` → `Secrets and variables` → `Actions`

Dodaj następujące secrets:

```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Vercel
VERCEL_TOKEN=your-vercel-token

# Database
DATABASE_URL=your-database-connection-string

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Jak uzyskać klucze API

#### OpenAI API Key
1. Przejdź do [OpenAI Platform](https://platform.openai.com/api-keys)
2. Kliknij "Create new secret key"
3. Skopiuj klucz (zaczyna się od `sk-`)

#### Vercel Token
1. Przejdź do [Vercel Account Settings](https://vercel.com/account/tokens)
2. Kliknij "Create Token"
3. Wybierz scope: `Full Account`
4. Skopiuj token

#### Supabase Keys
1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt
3. Przejdź do `Settings` → `API`
4. Skopiuj `Project URL` i `anon public` key

## Realne Testy API

### Co testuje workflow:

1. **OpenAI API Connectivity**
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}' \
        https://api.openai.com/v1/chat/completions
   ```

2. **Supabase Database Connectivity**
   ```bash
   curl -H "apikey: $SUPABASE_ANON_KEY" \
        "$SUPABASE_URL/rest/v1/"
   ```

3. **Vercel API Authentication**
   ```bash
   curl -H "Authorization: Bearer $VERCEL_TOKEN" \
        https://api.vercel.com/v1/user
   ```

4. **Custom API Endpoints**
   - Infrastructure validation
   - Metrics collection
   - Classification validation

## Bezpieczeństwo

### ✅ Co jest bezpieczne:
- Secrets są szyfrowane w GitHub
- Dostęp tylko do określonych branchy
- Logi nie pokazują wartości secrets
- Automatyczne rotowanie tokenów

### ⚠️ Best Practices:
1. **Używaj najmniejszych uprawnień** (principle of least privilege)
2. **Regularnie rotuj klucze** (co 30-90 dni)
3. **Monitoruj użycie API** w dashboardach
4. **Używaj environment-specific keys**

## Monitoring i Alerty

### GitHub Actions Notifications
```yaml
# Dodaj do workflow
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### API Usage Monitoring
```javascript
// W skrypcie walidacji
const apiUsage = {
  openai: { calls: 0, tokens: 0 },
  supabase: { calls: 0 },
  vercel: { calls: 0 }
};
```

## Troubleshooting

### Common Issues:

1. **"Invalid API Key"**
   - Sprawdź czy klucz jest poprawny
   - Upewnij się że nie ma spacji na początku/końcu

2. **"Rate Limit Exceeded"**
   - Dodaj retry logic
   - Użyj exponential backoff

3. **"Network Timeout"**
   - Zwiększ timeout w curl
   - Sprawdź firewall settings

### Debug Mode:
```yaml
- name: Debug API calls
  run: |
    echo "Testing with debug info..."
    curl -v -H "Authorization: Bearer $OPENAI_API_KEY" \
         https://api.openai.com/v1/models
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Cost Optimization

### OpenAI API:
- Używaj `gpt-3.5-turbo` zamiast `gpt-4` dla testów
- Ogranicz `max_tokens` w testach
- Cache responses gdzie możliwe

### Supabase:
- Używaj connection pooling
- Monitoruj query performance

## Przykład Użycia

### Lokalne testowanie:
```bash
# Ustaw environment variables
export OPENAI_API_KEY="sk-your-key"
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-key"

# Uruchom testy
npm run test:api
```

### W GitHub Actions:
```yaml
- name: Run API Tests
  run: npm run test:api
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Wyniki Testów

Workflow generuje:
- `validation-report.json` - strukturalne dane
- `validation-report.md` - czytelny raport
- Artifacts z wynikami testów
- Komentarze w PR z podsumowaniem

### Przykład raportu:
```markdown
# Phase 1 Validation Report

## Overall Status: PASSED

## API Connectivity Tests
- OpenAI API: ✅ Connected successfully
- Supabase API: ✅ Connected successfully  
- Vercel API: ✅ Connected successfully

## Test Coverage
- Coverage: 85%
- Unit Tests: 45/50 passed

## Summary
- API Connectivity: 3/3 APIs connected
- Test Coverage: 85%
- Overall Status: PASSED
```