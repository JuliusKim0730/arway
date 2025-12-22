# Vercel Deployment Guide

## GitHub Repository Setup ✅
- Repository: https://github.com/JuliusKim0730/arway
- Branch: main
- All files committed and pushed

## Vercel Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import the `JuliusKim0730/arway` repository

### 2. Configure Project Settings
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:

```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Deploy
- Click "Deploy"
- Vercel will automatically build and deploy your app
- You'll get a live URL like `https://arway-xxx.vercel.app`

## Backend Deployment (Separate)
The backend needs to be deployed separately to a service like:
- Railway
- Heroku  
- DigitalOcean App Platform
- AWS/GCP

Update `NEXT_PUBLIC_API_URL` with your backend URL once deployed.

## Auto-Deploy
- Any push to the `main` branch will automatically trigger a new deployment
- Pull requests will create preview deployments