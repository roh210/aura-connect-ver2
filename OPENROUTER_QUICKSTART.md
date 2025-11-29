# 🚀 Quick Start: Get OpenRouter API Key (2 minutes)

## Why OpenRouter?

- ✅ **FREE $5-10 credits** (no credit card needed!)
- ✅ **50% cheaper** than OpenAI direct
- ✅ **Access multiple AI models** (GPT-4, Claude, Gemini)
- ✅ **Same code** (drop-in replacement for OpenAI SDK)
- ✅ **Better rate limits** for development

---

## Step-by-Step Guide

### 1. Sign Up (30 seconds)

1. Go to: **https://openrouter.ai/**
2. Click **"Sign In"** (top right corner)
3. Click **"Continue with Google"** or **"Continue with GitHub"**
4. That's it! No email verification needed

---

### 2. Get Your API Key (30 seconds)

1. After login, you'll see the dashboard
2. Click **"Keys"** in the left sidebar (or go to https://openrouter.ai/keys)
3. Click **"Create Key"**
4. Name it: **"Aura Connect Development"**
5. Click **"Create"**
6. **Copy the key immediately** - it starts with `sk-or-v1-...`

---

### 3. Add to Your `.env` File (1 minute)

Open `backend/.env` and add:

```bash
# AI API Configuration (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-paste-your-key-here
```

**That's it!** Just one line. The OpenAI SDK will be configured to use OpenRouter in our `config/env.ts` file.

---

### 4. Verify Your Free Credits

1. Go to: https://openrouter.ai/credits
2. You should see **$5-10 free credits**
3. This is enough for **2-4 weeks** of active development!

---

## Model Prices (for reference)

When we build the AI router, we'll use:

| Model                 | Use Case           | Cost per 1M tokens | OpenRouter vs OpenAI |
| --------------------- | ------------------ | ------------------ | -------------------- |
| **GPT-4o**            | Icebreaker, Safety | $2.50              | Same price           |
| **GPT-3.5 Turbo**     | Stress analysis    | $0.50              | **50% cheaper!**     |
| **Claude 3.5 Sonnet** | Alternative option | $3.00              | N/A (not on OpenAI)  |

**Your $5 free credits = ~2000 AI requests during development!**

---

## How Our Code Works with OpenRouter

We'll configure the OpenAI SDK to use OpenRouter in our `config/env.ts` file:

```typescript
// config/env.ts (we'll create this next)
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,  // Your OpenRouter key from .env
  baseURL: 'https://openrouter.ai/api/v1'  // OpenRouter endpoint
});

// Now all API calls go to OpenRouter, not OpenAI!
const response = await openai.chat.completions.create({
  model: 'openai/gpt-4o',  // Specify model with provider prefix
  messages: [...]
});
```

**Model names in OpenRouter:**

- OpenAI GPT-4o: `openai/gpt-4o`
- OpenAI GPT-3.5: `openai/gpt-3.5-turbo`
- Anthropic Claude: `anthropic/claude-3.5-sonnet`
- Google Gemini: `google/gemini-pro`

---

## Troubleshooting

### "Invalid API key"

- Make sure you copied the full key (starts with `sk-or-v1-`)
- Check for extra spaces in `.env` file
- Verify the key is set as `OPENROUTER_API_KEY` in `.env`

### "Insufficient credits"

- Go to https://openrouter.ai/credits
- Click "Add Credits"
- Add $5-10 (should last weeks)

### "Rate limit exceeded"

- OpenRouter has generous limits (10 requests/second)
- If you hit this, add a small delay between requests
- We'll implement proper rate limiting in our code

---

## Switch to OpenAI Direct Later?

Easy! Just update the environment variable name and our config will handle it:

```bash
# Replace OpenRouter key with OpenAI key
OPENROUTER_API_KEY=sk-proj-your-openai-direct-key
```

Then update `config/env.ts` to remove the OpenRouter base URL. We'll show you how when we build the config layer.

**Minimal code changes** - just the configuration!

---

## Next Steps

Once you have your OpenRouter key in `.env`:

1. ✅ Get Daily.co API key (also free!)
2. ✅ Setup Firebase credentials
3. ✅ Tell me you're ready → We'll build the config layer and test the connection!

---

## Summary

**Time:** 2 minutes
**Cost:** $0 (free credits included)
**Benefit:** Access to GPT-4, Claude, Gemini for cheaper than OpenAI direct

🎉 **OpenRouter is perfect for MVPs and development!**
