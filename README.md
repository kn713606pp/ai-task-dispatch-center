<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Task Dispatch Center

AI 任務派遣中心 - 支援長時間錄音轉文字

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rp4dhTYsMW2iulJQM8tUbbf-JGZmQUa8

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway Deployment
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

### Google Cloud Deployment
1. Install Google Cloud CLI
2. Run: `gcloud builds submit --config cloudbuild.yaml`
