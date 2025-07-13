# GitHub Actions Testing Guide for Migration Plans

## Overview

Ten przewodnik zawiera szczegółowe instrukcje konfiguracji i użytkowania GitHub Actions do testowania realnego działania aplikacji z kluczami API podczas migracji.

## 📋 Spis Treści

1. [Konfiguracja GitHub Secrets](#konfiguracja-github-secrets)
2. [Workflow Configuration](#workflow-configuration)
3. [Testowanie Phase 1](#testowanie-phase-1)
4. [Testowanie Phase 2](#testowanie-phase-2)
5. [Testowanie Phase 3](#testowanie-phase-3)
6. [Testowanie Phase 4](#testowanie-phase-4)
7. [Monitoring i Alerty](#monitoring-i-alerty)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## 🔐 Konfiguracja GitHub Secrets

### Krok 1: Dostęp do Settings

1. Przejdź do swojego GitHub repository
2. Kliknij zakładkę **Settings**
3. W lewym menu wybierz **Secrets and variables** → **Actions**

### Krok 2: Dodawanie Secrets

Kliknij **New repository secret** i dodaj następujące secrets:

#### OpenAI API
```bash
Name: OPENAI_API_KEY
Value: sk-your-actual-openai-api-key
```
**Jak uzyskać:**
1. Przejdź do [OpenAI Platform](https://platform.openai.com/api-keys)
2. Kliknij **Create new secret key**
3. Skopiuj klucz (zaczyna się od `sk-`)
4. **⚠️ Uwaga:** Klucz jest pokazywany tylko raz!

#### Vercel Token
```bash
Name: VERCEL_TOKEN
Value: your-vercel-token
```
**Jak uzyskać:**
1. Przejdź do [Vercel Account Settings](https://vercel.com/account/tokens)
2. Kliknij **Create Token**
3. Wybierz scope: **Full Account**
4. Skopiuj token

#### Supabase Configuration
```bash
Name: SUPABASE_URL
Value: https://your-project-id.supabase.co

Name: SUPABASE_ANON_KEY
Value: your-supabase-anon-key
```
**Jak uzyskać:**
1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj **Project URL** i **anon public** key

#### Database Configuration
```bash
Name: DATABASE_URL
Value: postgresql://username:password@host:port/database
```
**Jak uzyskać:**
1. Z Supabase: **Settings** → **Database** → **Connection string**
2. Z własnej bazy: Skonfiguruj connection string

#### Optional: Slack Notifications
```bash
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Krok 3: Weryfikacja Secrets

Sprawdź czy wszystkie secrets zostały dodane:

```bash
# W GitHub Actions workflow
- name: Verify Secrets
  run: |
    echo "Checking required secrets..."
    if [ -z "$OPENAI_API_KEY" ]; then echo "❌ OPENAI_API_KEY missing"; exit 1; fi
    if [ -z "$VERCEL_TOKEN" ]; then echo "❌ VERCEL_TOKEN missing"; exit 1; fi
    if [ -z "$SUPABASE_URL" ]; then echo "❌ SUPABASE_URL missing"; exit 1; fi
    if [ -z "$SUPABASE_ANON_KEY" ]; then echo "❌ SUPABASE_ANON_KEY missing"; exit 1; fi
    echo "✅ All secrets configured"
```

## 🔧 Workflow Configuration

### Struktura Workflow

Workflow znajduje się w: `.github/workflows/phase1-validation.yml`

```yaml
name: Phase 1 Validation with Real API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch: # Manual trigger

jobs:
  phase1-validation:
    runs-on: ubuntu-latest
    steps:
      # ... szczegółowe kroki poniżej
```

### Konfiguracja Environment Variables

```yaml
- name: Setup environment variables
  run: |
    echo "Setting up test environment..."
    echo "OPENAI_API_KEY=${OPENAI_API_KEY}" >> $GITHUB_ENV
    echo "VERCEL_TOKEN=${VERCEL_TOKEN}" >> $GITHUB_ENV
    echo "DATABASE_URL=${DATABASE_URL}" >> $GITHUB_ENV
    echo "SUPABASE_URL=${SUPABASE_URL}" >> $GITHUB_ENV
    echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}" >> $GITHUB_ENV
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 🧪 Testowanie Phase 1

### Automatyczne Testy

Workflow automatycznie testuje:

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

### Manualne Uruchomienie

1. Przejdź do **Actions** tab w GitHub
2. Wybierz **Phase 1 Validation with Real API Tests**
3. Kliknij **Run workflow**
4. Wybierz branch i kliknij **Run workflow**

### Sprawdzanie Wyników

1. **W GitHub Actions:**
   - Przejdź do **Actions** → **Phase 1 Validation**
   - Kliknij na konkretny run
   - Sprawdź logs każdego step

2. **W Pull Request:**
   - Workflow automatycznie komentuje PR z wynikami
   - Sprawdź artifacts dla szczegółowych raportów

### Success Criteria dla Phase 1

```yaml
# W workflow
- name: Check Phase 1 Success
  run: |
    if [ "$API_SUCCESS_COUNT" -eq 3 ] && [ "$COVERAGE" -ge 80 ]; then
      echo "✅ Phase 1 PASSED"
      echo "::set-output name=phase1_status::passed"
    else
      echo "❌ Phase 1 FAILED"
      echo "::set-output name=phase1_status::failed"
      exit 1
    fi
```

## 🧪 Testowanie Phase 2

### Konfiguracja dla Phase 2

Dodaj nowe secrets jeśli potrzebne:

```bash
# Dla A/B testing
Name: AB_TESTING_ENABLED
Value: true

# Dla monitoring
Name: MONITORING_API_KEY
Value: your-monitoring-key
```

### Workflow dla Phase 2

```yaml
# .github/workflows/phase2-validation.yml
name: Phase 2 Validation

on:
  workflow_run:
    workflows: ["Phase 1 Validation"]
    types: [completed]
    branches: [main]

jobs:
  phase2-validation:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Test A/B Testing Infrastructure
        run: |
          echo "Testing A/B testing setup..."
          # Testy A/B testing
          
      - name: Test Classification System
        run: |
          echo "Testing classification system..."
          # Testy klasyfikacji
```

### Testy Phase 2

```javascript
// tests/phase2-validation.test.js
describe('Phase 2 Validation', () => {
  test('should handle A/B testing', async () => {
    const response = await fetch('/api/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant: 'A' })
    });
    expect(response.status).toBe(200);
  });
  
  test('should classify user intent', async () => {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    expect(response.status).toBe(200);
  });
});
```

## 🧪 Testowanie Phase 3

### Konfiguracja dla Phase 3

```bash
# Dla agent architecture
Name: AGENT_CONFIG_URL
Value: https://your-agent-config.com

# Dla self-reflection
Name: REFLECTION_ENABLED
Value: true
```

### Workflow dla Phase 3

```yaml
# .github/workflows/phase3-validation.yml
name: Phase 3 Validation

jobs:
  phase3-validation:
    runs-on: ubuntu-latest
    
    steps:
      - name: Test Agent Architecture
        run: |
          echo "Testing agent architecture..."
          curl -X POST \
               -H "Content-Type: application/json" \
               -d '{"test": "agent"}' \
               https://your-app.vercel.app/api/validate-agent
               
      - name: Test Self-Reflection
        run: |
          echo "Testing self-reflection..."
          curl -X POST \
               -H "Content-Type: application/json" \
               -d '{"test": "reflection"}' \
               https://your-app.vercel.app/api/validate-reflection
```

## 🧪 Testowanie Phase 4

### Konfiguracja dla Phase 4

```bash
# Dla microservices
Name: MICROSERVICES_ENABLED
Value: true

# Dla production deployment
Name: PRODUCTION_ENV
Value: production
```

### Workflow dla Phase 4

```yaml
# .github/workflows/phase4-validation.yml
name: Phase 4 Validation

jobs:
  phase4-validation:
    runs-on: ubuntu-latest
    
    steps:
      - name: Test Microservices Migration
        run: |
          echo "Testing microservices..."
          # Testy microservices
          
      - name: Test Production Deployment
        run: |
          echo "Testing production deployment..."
          # Testy production
          
      - name: Final Validation Report
        run: |
          echo "Generating final validation report..."
          node scripts/generate-final-report.js
```

## 📊 Monitoring i Alerty

### GitHub Actions Notifications

```yaml
- name: Notify on Success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    fields: repo,message,commit,author,action,eventName,ref,workflow,job,took

- name: Notify on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
    fields: repo,message,commit,author,action,eventName,ref,workflow,job,took
```

### Email Notifications

```yaml
- name: Send Email Report
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 587
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "Phase ${{ github.run_number }} Validation Results"
    to: ${{ secrets.NOTIFICATION_EMAIL }}
    from: GitHub Actions
    body: |
      Phase validation completed with status: ${{ job.status }}
      
      Check details at: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### Custom Dashboard

```javascript
// scripts/generate-dashboard.js
const generateDashboard = async () => {
  const results = await fetchValidationResults();
  
  const dashboard = {
    phase1: { status: results.phase1.status, coverage: results.phase1.coverage },
    phase2: { status: results.phase2.status, abTesting: results.phase2.abTesting },
    phase3: { status: results.phase3.status, agents: results.phase3.agents },
    phase4: { status: results.phase4.status, microservices: results.phase4.microservices }
  };
  
  return dashboard;
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Invalid API Key"
```bash
# Sprawdź format OpenAI key
echo $OPENAI_API_KEY | head -c 10
# Powinno pokazać: sk-12345678

# Sprawdź czy key jest aktywny
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### 2. "Rate Limit Exceeded"
```yaml
# Dodaj retry logic
- name: Test with retry
  run: |
    for i in {1..3}; do
      echo "Attempt $i..."
      curl -H "Authorization: Bearer $OPENAI_API_KEY" \
           https://api.openai.com/v1/models && break
      sleep $((i * 2))
    done
```

#### 3. "Network Timeout"
```yaml
# Zwiększ timeout
- name: Test with timeout
  run: |
    curl --max-time 30 --retry 3 \
         -H "Authorization: Bearer $OPENAI_API_KEY" \
         https://api.openai.com/v1/models
```

#### 4. "Secret Not Found"
```bash
# Sprawdź czy secret jest ustawiony
if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY not set"
  exit 1
fi
```

### Debug Mode

```yaml
- name: Debug API calls
  run: |
    echo "Debug mode enabled..."
    curl -v -H "Authorization: Bearer $OPENAI_API_KEY" \
         https://api.openai.com/v1/models
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Log Analysis

```bash
# Pobierz logs z failed workflow
gh run download $RUN_ID --log

# Analizuj logs
grep -i "error\|failed\|timeout" workflow-log.txt
```

## ✅ Best Practices

### 1. Security
- **Rotuj klucze regularnie** (co 30-90 dni)
- **Używaj najmniejszych uprawnień** (principle of least privilege)
- **Monitoruj użycie API** w dashboardach
- **Nie commituj kluczy** do kodu

### 2. Performance
- **Cache responses** gdzie możliwe
- **Używaj connection pooling** dla bazy danych
- **Ogranicz API calls** w testach
- **Używaj lightweight models** dla testów

### 3. Reliability
- **Dodaj retry logic** dla API calls
- **Używaj exponential backoff**
- **Set appropriate timeouts**
- **Handle rate limits gracefully**

### 4. Monitoring
- **Track API usage** i costs
- **Monitor response times**
- **Set up alerts** dla failures
- **Log all API interactions**

### 5. Testing Strategy
- **Test in isolation** przed integration
- **Use mocks** dla external dependencies
- **Test error scenarios**
- **Validate response formats**

## 📈 Success Metrics

### Phase 1 Success Criteria
- ✅ OpenAI API connectivity: 100%
- ✅ Supabase connectivity: 100%
- ✅ Vercel API connectivity: 100%
- ✅ Test coverage: ≥80%
- ✅ All unit tests pass
- ✅ All E2E tests pass

### Phase 2 Success Criteria
- ✅ A/B testing infrastructure: Working
- ✅ Classification accuracy: ≥90%
- ✅ Response time: <2s
- ✅ Error rate: <1%

### Phase 3 Success Criteria
- ✅ Agent architecture: Deployed
- ✅ Self-reflection: Working
- ✅ Multi-step reasoning: Functional
- ✅ Performance: Maintained

### Phase 4 Success Criteria
- ✅ Microservices: Migrated
- ✅ Production deployment: Successful
- ✅ Monitoring: Active
- ✅ All phases: Completed

## 🔄 Continuous Improvement

### Regular Reviews
- **Weekly**: Review test results
- **Monthly**: Update API keys
- **Quarterly**: Review security settings
- **Annually**: Update testing strategy

### Feedback Loop
```yaml
- name: Collect Feedback
  run: |
    echo "Collecting feedback from test results..."
    # Analiza wyników i sugestie ulepszeń
```

### Documentation Updates
- **Update guides** based on issues
- **Add new troubleshooting** steps
- **Improve examples** and code snippets
- **Maintain best practices** list

---

## 📞 Support

### Getting Help
1. **Check logs** w GitHub Actions
2. **Review troubleshooting** section
3. **Check API documentation** for each service
4. **Contact support** if needed

### Useful Links
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Emergency Contacts
- **GitHub Support**: [support.github.com](https://support.github.com)
- **OpenAI Support**: [help.openai.com](https://help.openai.com)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)