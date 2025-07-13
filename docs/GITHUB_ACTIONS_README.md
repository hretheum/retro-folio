# GitHub Actions z Realnymi Testami API

## 🚀 Szybki Start

### 1. Skonfiguruj Secrets w GitHub

Przejdź do: `Settings` → `Secrets and variables` → `Actions`

Dodaj następujące secrets:

```bash
OPENAI_API_KEY=sk-your-actual-key
VERCEL_TOKEN=your-actual-token
DATABASE_URL=your-actual-db-url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-key
```

### 2. Uruchom Workflow

Workflow uruchamia się automatycznie przy:
- Push do `main` lub `develop`
- Pull Request do `main`
- Manual trigger (`workflow_dispatch`)

## 🔧 Co testuje workflow

### ✅ Realne API Tests
- **OpenAI API**: Testuje połączenie i generowanie odpowiedzi
- **Supabase**: Testuje połączenie z bazą danych
- **Vercel API**: Testuje autoryzację i dostęp do projektów
- **Custom Endpoints**: Testuje własne endpointy walidacji

### ✅ Test Coverage
- Unit tests z Jest
- Integration tests
- E2E tests z Playwright
- API connectivity tests

### ✅ Validation Reports
- Automatyczne generowanie raportów
- Upload artifacts
- Komentarze w PR z wynikami

## 📊 Przykład Wyników

```markdown
## Phase 1 Validation Results

### ✅ Tests Passed: 45
### ❌ Tests Failed: 2
### 📊 Coverage: 87%

### 🔌 API Tests:
- OpenAI API: ✅ Connected successfully
- Supabase API: ✅ Connected successfully
- Vercel API: ✅ Connected successfully
```

## 🛠️ Lokalne Testowanie

### Ustaw environment variables:
```bash
cp .env.example .env
# Edytuj .env z prawdziwymi kluczami
```

### Uruchom testy:
```bash
# Wszystkie testy
npm run test:ci

# Tylko API tests
npm run test:api

# Tylko validation
npm run test:validation
```

## 🔒 Bezpieczeństwo

### ✅ Co jest bezpieczne:
- Secrets są szyfrowane w GitHub
- Logi nie pokazują wartości secrets
- Dostęp tylko do określonych branchy
- Automatyczne rotowanie tokenów

### ⚠️ Best Practices:
1. **Używaj najmniejszych uprawnień**
2. **Regularnie rotuj klucze** (co 30-90 dni)
3. **Monitoruj użycie API**
4. **Używaj environment-specific keys**

## 🚨 Troubleshooting

### "Invalid API Key"
```bash
# Sprawdź format klucza OpenAI
echo $OPENAI_API_KEY | head -c 10
# Powinno pokazać: sk-12345678
```

### "Rate Limit Exceeded"
```yaml
# Dodaj retry logic do workflow
- name: Test with retry
  run: |
    for i in {1..3}; do
      curl -H "Authorization: Bearer $OPENAI_API_KEY" \
           https://api.openai.com/v1/models && break
      sleep $((i * 2))
    done
```

### "Network Timeout"
```yaml
# Zwiększ timeout
- name: Test with timeout
  run: |
    curl --max-time 30 -H "Authorization: Bearer $OPENAI_API_KEY" \
         https://api.openai.com/v1/models
```

## 📈 Monitoring

### GitHub Actions Dashboard
- Przejdź do `Actions` tab w GitHub
- Zobacz historię workflow runs
- Sprawdź logs i artifacts

### API Usage Monitoring
```javascript
// W skrypcie walidacji
const apiUsage = {
  openai: { calls: 0, tokens: 0 },
  supabase: { calls: 0 },
  vercel: { calls: 0 }
};
```

## 🔄 Continuous Integration

### Automatyczne deployment
```yaml
# Dodaj do workflow
- name: Deploy to Vercel
  if: success()
  run: |
    npx vercel --prod --token $VERCEL_TOKEN
```

### Slack notifications
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 📝 Customization

### Dodaj własne testy API:
```javascript
// W tests/api-validation.test.js
test('should test custom endpoint', async () => {
  const response = await fetch('/api/custom-endpoint');
  expect(response.status).toBe(200);
});
```

### Modyfikuj workflow:
```yaml
# W .github/workflows/phase1-validation.yml
- name: Custom API Test
  run: |
    curl -X POST \
         -H "Content-Type: application/json" \
         -d '{"custom": "data"}' \
         https://your-api.com/test
```

## 🎯 Success Metrics

Workflow uznaje testy za udane gdy:
- ✅ Wszystkie API tests przechodzą
- ✅ Coverage >= 80%
- ✅ Unit tests przechodzą
- ✅ E2E tests przechodzą

## 📞 Support

Jeśli masz problemy:
1. Sprawdź logs w GitHub Actions
2. Upewnij się że wszystkie secrets są ustawione
3. Sprawdź czy API keys są aktywne
4. Sprawdź rate limits w dashboardach API