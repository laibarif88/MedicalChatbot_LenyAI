# Vercel Deployment Guide for Leny AI Medical Chat

## Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables ready

## Deployment Steps

### 1. Initial Setup

#### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel
```

#### Option B: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect the framework (Vite)

### 2. Configure Environment Variables

In the Vercel dashboard for your project:

1. Go to Settings → Environment Variables
2. Add the following variables (refer to `.env.vercel.example`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_OPENAI_API_KEY
VITE_DEEPSEEK_API_KEY
```

### 3. Build Configuration

The `vercel.json` file is already configured with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite
- SPA routing support (rewrites to index.html)
- Asset caching headers

### 4. Deploy

#### For subsequent deployments:

**Automatic Deployments:**
- Production: Pushes to main branch auto-deploy
- Preview: Pull requests create preview deployments

**Manual Deployments:**
```bash
# Deploy to production
vercel --prod

# Create a preview deployment
vercel
```

## Firebase Functions Deployment

Note: Firebase Functions need to be deployed separately to Firebase:

```bash
# Deploy Firebase functions
cd functions
npm run deploy
```

Or from root:
```bash
firebase deploy --only functions
```

## Important Notes

### Domain Configuration
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update Firebase Auth authorized domains

### Firebase Configuration
Ensure your Firebase project settings include:
- Vercel deployment URL in authorized domains
- CORS configuration for your API endpoints

### Build Optimization

The current build shows a warning about chunk sizes. Consider:

1. **Code Splitting:** 
   - Implement dynamic imports for large components
   - Split blog data into separate chunks

2. **Example optimization for BlogData:**
```javascript
// Instead of importing all blog data
import { blogPosts } from './data/blogData';

// Use dynamic import
const loadBlogData = () => import('./data/blogData');
```

### Environment-Specific Settings

Use different environment variables for:
- Development (`.env.development`)
- Preview (`.env.preview`)
- Production (`.env.production`)

### Monitoring

After deployment:
1. Check Vercel Analytics for performance metrics
2. Monitor build times and sizes
3. Review function logs in Vercel dashboard

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Node version compatibility
   - Verify all dependencies are in package.json
   - Review build logs in Vercel dashboard

2. **Environment Variables:**
   - Ensure all VITE_ prefixed variables are set
   - Check for typos in variable names
   - Verify values don't contain invalid characters

3. **404 Errors on Routes:**
   - Verify vercel.json rewrites configuration
   - Check that index.html is in dist folder

4. **Large Bundle Size:**
   - Review imports and remove unused code
   - Implement code splitting
   - Use production builds for dependencies

### Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Documentation](https://firebase.google.com/docs)

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Firebase project settings updated with Vercel URL
- [ ] Build completes successfully locally (`npm run build`)
- [ ] Git repository connected to Vercel
- [ ] Custom domain configured (if applicable)
- [ ] Firebase functions deployed separately
- [ ] Test deployment with preview URL
- [ ] Verify all features work in production

## Security Considerations

1. Never commit `.env` files to version control
2. Use Vercel's environment variable encryption
3. Rotate API keys regularly
4. Set up proper CORS policies
5. Enable Vercel's DDoS protection

## Performance Monitoring

After deployment, monitor:
- Core Web Vitals in Vercel Analytics
- Bundle size trends
- API response times
- Error rates in production

---

**Last Updated:** September 2025
**Version:** 1.0.0
