# Environment Variables Setup for Vercel

Your project has been linked to Vercel successfully as: **leny-ai-studio-2**

## Quick Setup Steps

1. **Go to your Vercel Dashboard:**
   https://vercel.com/michelchoueiri-gmailcoms-projects/leny-ai-studio-2/settings/environment-variables

2. **Add the following environment variables:**

   | Key | Value Source |
   |-----|-------------|
   | `VITE_FIREBASE_API_KEY` | From your Firebase Console |
   | `VITE_FIREBASE_AUTH_DOMAIN` | From your Firebase Console |
   | `VITE_FIREBASE_PROJECT_ID` | From your Firebase Console |
   | `VITE_FIREBASE_STORAGE_BUCKET` | From your Firebase Console |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | From your Firebase Console |
   | `VITE_FIREBASE_APP_ID` | From your Firebase Console |
   | `VITE_FIREBASE_MEASUREMENT_ID` | From your Firebase Console |
   | `VITE_OPENAI_API_KEY` | From your OpenAI account |
   | `VITE_DEEPSEEK_API_KEY` | From your DeepSeek account |

3. **For each variable:**
   - Click "Add New"
   - Enter the Key (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter the Value (your actual API key)
   - Select environments: Production, Preview, Development
   - Click "Save"

4. **Get Firebase Config Values:**
   - Go to Firebase Console: https://console.firebase.google.com
   - Select your project
   - Click on the gear icon → Project Settings
   - Scroll down to "Your apps" → Firebase SDK snippet
   - Copy each value from the config object

5. **After adding all variables:**
   - Return to terminal and redeploy
   - Or trigger a redeploy from the Vercel dashboard

## Alternative: Using Vercel CLI

You can also set environment variables using the CLI:

```bash
# Example for one variable
npx vercel env add VITE_FIREBASE_API_KEY

# It will prompt you for:
# - The value
# - Which environments to add it to
```

## Verify Environment Variables

After setting up, you can verify they're set:
```bash
npx vercel env ls
```

## Redeploy After Setting Variables

Once all environment variables are set, redeploy:
```bash
npx vercel --prod
