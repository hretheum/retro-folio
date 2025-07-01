# Google OAuth Setup for Admin Panel

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - `https://retro-xxx.vercel.app` (your production URL)
7. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `https://retro-xxx.vercel.app`
8. Copy the Client ID

## 2. Configure Environment Variables

### Local Development
Add to `.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id-here
VITE_ALLOWED_EMAILS=your-email@gmail.com,friend@gmail.com
```

### Production (Vercel)
Add in Vercel Dashboard → Settings → Environment Variables:
- `VITE_GOOGLE_CLIENT_ID` = your-client-id
- `VITE_ALLOWED_EMAILS` = comma-separated list of allowed emails (optional)

## 3. How It Works

- Navigate to `/admin`
- If not logged in, redirects to `/login`
- Sign in with Google
- If email is in allowed list (or list is empty), grants access
- Session persists in localStorage

## 4. Restrict Access (Optional)

To restrict admin access to specific emails:

1. Set `VITE_ALLOWED_EMAILS` in environment variables
2. Multiple emails: `email1@gmail.com,email2@gmail.com`
3. Leave empty to allow any Google account

## 5. Logout

The logout button is in the admin panel header.