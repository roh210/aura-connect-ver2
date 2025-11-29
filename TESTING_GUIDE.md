# Testing the Express Server 🧪

This guide shows how to test all API endpoints manually.

## Step 1: Start the Server

```bash
cd backend
npm run dev
```

Expected output:

```
✅ Environment validated successfully
✅ Logger initialized
✅ Firebase Admin SDK initialized
✅ Firestore database ready
Server running on port 5000
```

---

## Step 2: Test Health Endpoint

**Using curl (recommended):**

```bash
curl http://localhost:5000/health
```

**Using PowerShell:**

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET | Select-Object -ExpandProperty Content
```

**Using browser:**
Open: http://localhost:5000/health

**Expected response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T16:00:00.000Z",
  "uptime": 15.234,
  "environment": "development"
}
```

---

## Step 3: Test Root Endpoint

```bash
curl http://localhost:5000/
```

**Expected response:**

```json
{
  "message": "Aura Connect API",
  "version": "1.0.0",
  "documentation": "https://docs.aura-connect.com",
  "health": "/health",
  "endpoints": {
    "sessions": "/api/sessions",
    "ai": "/api/ai",
    "voice": "/api/voice"
  }
}
```

---

## Step 4: Test Session Creation

```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "user_123",
    "studentName": "Alex",
    "seniorId": "user_456",
    "seniorName": "Margaret"
  }'
```

**Expected response (201 Created):**

```json
{
  "sessionId": "session_92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
  "roomUrl": "https://aura-connect.daily.co/92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
  "studentToken": "eyJhbGci...",
  "seniorToken": "eyJhbGci...",
  "icebreaker": "Alex, I'd love to hear what brought you here today...",
  "expiresAt": "2025-11-19T17:00:00.000Z"
}
```

---

## Step 5: Test AI Endpoints

### 5a. Generate Icebreaker

```bash
curl -X POST http://localhost:5000/api/ai/icebreaker \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Alex",
    "studentBio": "22, studying CS, stressed about exams",
    "seniorName": "Margaret",
    "seniorBio": "75, retired teacher, loves gardening"
  }'
```

### 5b. Analyze Stress

```bash
curl -X POST http://localhost:5000/api/ai/stress \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have 3 exams tomorrow and I haven't slept in 2 days"
  }'
```

**Expected response:**

```json
{
  "stressLevel": 85,
  "severity": "high"
}
```

### 5c. Check Safety

```bash
curl -X POST http://localhost:5000/api/ai/safety \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I don't see the point anymore"
  }'
```

**Expected response:**

```json
{
  "safe": false,
  "severity": "high",
  "flags": ["suicidal ideation", "hopelessness"]
}
```

---

## Step 6: Test Voice Endpoints

### 6a. Create Voice Room

```bash
curl -X POST http://localhost:5000/api/voice/room \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_789",
    "studentName": "Alex",
    "seniorName": "Margaret"
  }'
```

### 6b. Generate Token (for reconnection)

```bash
curl -X POST http://localhost:5000/api/voice/token \
  -H "Content-Type: application/json" \
  -d '{
    "roomName": "92ecf3a3-40b6-4406-9c72-7c16aea39fd5",
    "userId": "user_123",
    "userName": "Alex",
    "role": "student"
  }'
```

---

## Step 7: Test Error Handling

### 7a. Test 404 (Route Not Found)

```bash
curl http://localhost:5000/api/nonexistent
```

**Expected response (404):**

```json
{
  "error": "Route not found",
  "message": "Cannot GET /api/nonexistent"
}
```

### 7b. Test Validation Error

```bash
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "user_123"
  }'
```

**Expected response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "studentName",
      "message": "Student name is required"
    },
    {
      "field": "seniorId",
      "message": "Senior ID is required"
    },
    {
      "field": "seniorName",
      "message": "Senior name is required"
    }
  ]
}
```

### 7c. Test Rate Limiting

Send 101 requests in 15 minutes:

```bash
for i in {1..101}; do
  curl http://localhost:5000/health
done
```

**Expected response after 100 requests (429 Too Many Requests):**

```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Troubleshooting

### Server won't start

**Error: `Missing required environment variables`**

- Check `backend/.env` file exists
- Verify all API keys are set (OPENROUTER*API_KEY, DAILY_API_KEY, FIREBASE*\*)

**Error: `Port 5000 already in use`**

- Change PORT in `.env` to 3001
- Or kill process using port 5000: `lsof -ti:5000 | xargs kill`

### Can't connect to server

**Error: `Unable to connect to the remote server`**

- Windows Firewall might be blocking Node.js
- Try accessing from browser: http://localhost:5000/health
- Check server is running: `ps aux | grep node`

### API returns 500 errors

- Check server logs in terminal
- Verify API keys are correct
- Check OpenRouter/Daily.co/Firebase are not down

---

## Using Postman (Recommended for Testing)

1. Download Postman: https://www.postman.com/downloads/
2. Create new collection: "Aura Connect API"
3. Add requests:
   - GET http://localhost:5000/health
   - POST http://localhost:5000/api/sessions (with JSON body)
   - POST http://localhost:5000/api/ai/stress (with JSON body)
4. Save requests for reuse
5. Run entire collection to test all endpoints

---

## Next Steps

Once all endpoints return 200/201 responses:
✅ Express server setup complete
✅ Ready for Phase 2.7: WebSocket Implementation

**Server logs show:**

- HTTP requests (GET /api/sessions 200 15ms)
- Validation errors (field: studentName, message: "Student name is required")
- AI calls (stress level: 85, severity: high)
- Voice room creation (roomName: 92ecf3a3...)
