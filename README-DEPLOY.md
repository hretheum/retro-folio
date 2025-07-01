# Deployment Guide for Vercel

## Prerequisites

1. Vercel account
2. Project pushed to GitHub/GitLab

## Steps

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Add Redis Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database"
5. Select "Upstash Redis"
6. Follow the setup wizard
7. Database will be automatically connected

### 3. Environment Variables

Vercel will automatically add these from Redis setup:
- `KV_URL`
- `KV_REST_API_URL` 
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 4. Deploy Updates

```bash
# Production deploy
vercel --prod

# Preview deploy
vercel
```

## Local Development with Redis

1. Copy `.env.local.example` to `.env.local`
2. Add your Redis credentials from Vercel dashboard
3. Run `npm run dev`

## Migrate Existing Data

To migrate data from localStorage to Redis:

1. Export from browser console:
```javascript
const data = {
  work: JSON.parse(localStorage.getItem('admin-work-items') || '[]'),
  timeline: JSON.parse(localStorage.getItem('admin-timeline-items') || '[]'),
  experiment: JSON.parse(localStorage.getItem('admin-experiment-items') || '[]')
};
console.log(JSON.stringify(data));
```

2. Import via API:
```javascript
// For each type
fetch('/api/content/timeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(item)
});
```