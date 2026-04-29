#!/bin/bash

echo "Setting up Vercel environment variables..."

# Firebase Configuration
echo "AIza..." | npx vercel env add VITE_FIREBASE_API_KEY production
echo "lenydatabase.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo "lenydatabase" | npx vercel env add VITE_FIREBASE_PROJECT_ID production
echo "lenydatabase.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo "727407011562" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo "1:e229341993...." | npx vercel env add VITE_FIREBASE_APP_ID production

# DeepSeek API Key
echo "sk-8e2300fe9ce04d409ce0be4d97d3dc34" | npx vercel env add VITE_DEEPSEEK_API_KEY production

# Add the same variables for preview and development environments
echo "AIza..." | npx vercel env add VITE_FIREBASE_API_KEY preview
echo "lenydatabase.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN preview
echo "lenydatabase" | npx vercel env add VITE_FIREBASE_PROJECT_ID preview
echo "lenydatabase.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET preview
echo "727407011562" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID preview
echo "1:727407011562:web:81aec7bade49e229341993" | npx vercel env add VITE_FIREBASE_APP_ID preview
echo "sk-8e2300f......" | npx vercel env add VITE_DEEPSEEK_API_KEY preview

echo "AIz....." | npx vercel env add VITE_FIREBASE_API_KEY development
echo "lenydatabase.firebaseapp.com" | npx vercel env add VITE_FIREBASE_AUTH_DOMAIN development
echo "lenydatabase" | npx vercel env add VITE_FIREBASE_PROJECT_ID development
echo "lenydatabase.firebasestorage.app" | npx vercel env add VITE_FIREBASE_STORAGE_BUCKET development
echo "727407011562" | npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID development
echo "1:727407...." | npx vercel env add VITE_FIREBASE_APP_ID development
echo "sk-8e2300..." | npx vercel env add VITE_DEEPSEEK_API_KEY development

echo "Environment variables setup complete!"
echo "You can now redeploy with: npx vercel --prod"
