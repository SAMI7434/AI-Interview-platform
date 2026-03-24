# Gemini API Setup Guide

## Overview
The MockMate application has been updated to use **Google's Gemini API** instead of OpenRouter API for generating interview questions and reviews.

## Changes Made

### 1. **Updated API Configuration**
- Changed from OpenRouter API to Google Gemini API
- Updated endpoint to: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

### 2. **Modified Functions**
- ✅ `callGeminiAPI()` - Replaces the old streaming API call with Gemini's synchronous API
- ✅ `GenerateReview` - Now uses Gemini API for generating interview reviews
- ✅ `generateQuestions()` - Now uses Gemini API for generating interview questions

### 3. **Error Handling Improvements**
- Better error messages and logging
- Graceful fallback for missing API keys
- More detailed debugging information

## Setup Instructions

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Click "Create API key in new project"
4. Copy your API key

### Step 2: Update Environment Variables

Edit the `.env` file in the `server` directory and update:

```env
# Replace the old OPENROUTER_API_KEY with:
GEMINI_API_KEY=your_api_key_here
```

**Before:**
```env
OPENROUTER_API_KEY=AIzaSyCEiN03lWsJ41YMDnvv9vXSrSbq3ljwxPc
```

**After:**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Step 3: Verify Installation

Restart your server:

```bash
# Kill the current process (Ctrl+C)
# Then restart with:
npm run dev
```

Check for console messages like:
- `✅ Gemini API configured successfully`
- `✅ Review received from Gemini`
- `✅ Core Subjects: Generated 5 questions`

## API Features

### Question Generation
- **DSA Questions**: 5 data structure & algorithm questions
- **Technical Questions**: 5 tech stack-specific questions  
- **Core Subject Questions**: 5 fundamental computer science questions

### Interview Reviews
- Individual question reviews with constructive feedback
- Overall interview rating (1-5 scale)
- Summary of strengths and areas for improvement

## Troubleshooting

### Error: "GEMINI_API_KEY not configured"
- Ensure the `.env` file has `GEMINI_API_KEY=your_key`
- Restart the server after updating `.env`
- Check there are no extra spaces in the key

### Error: "Empty response from Gemini API"
- Verify your API key is valid
- Check your internet connection
- Try regenerating the API key in Google AI Studio

### Error: "Gemini API error: 401"
- Invalid or expired API key
- Get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Questions not generating
- Check server logs for error messages
- Verify `GEMINI_API_KEY` is set correctly
- Ensure interview details are properly formatted

## API Rate Limits

The Gemini API has the following free tier limits:
- **60 requests per minute** for free tier
- **Unlimited tokens per minute** for free tier

For higher limits, consider upgrading to a paid plan.

## File Changes

### Modified Files:
- `server/src/controllers/gemini.controllers.ts`
  - Replaced OpenRouter API calls with Gemini API
  - Updated `callGeminiAPI()` function
  - Updated review generation logic
  - Updated question generation logic

## Testing

Test the integration:

```bash
# 1. Start server
npm run dev

# 2. In client, create a new mock interview
# 3. Complete the interview and save responses
# 4. Click "Generate Review"
# 5. Verify you get feedback from Gemini AI
```

## Resources

- [Google Generative AI API Docs](https://ai.google.dev/docs)
- [Gemini API Guide](https://ai.google.dev/tutorials)
- [API Rate Limits](https://ai.google.dev/guide/limits)

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your API key is valid
3. Check the `.env` file configuration
4. Restart the server after changes

---

**Note**: Keep your API key private and never commit it to version control. Always use environment variables.
