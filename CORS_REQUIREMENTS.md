# CORS Configuration Requirements

## Current Issue Resolution

### Problem
The frontend was receiving 401 authentication errors due to CORS configuration mismatch between the local development environment and the Cloud Run backend.

### Root Cause
- **Backend CORS Configuration**: `http://localhost:3000`
- **Frontend was running on**: `http://localhost:3001` (due to port 3000 being occupied)
- **Result**: CORS preflight requests failed, causing authentication failures

## Solution Implemented

### Frontend Fix (Immediate)
- Forced Next.js to run on port 3000 using `PORT=3000 npm run dev`
- Fixed error logging to show detailed CORS/authentication error information
- Enhanced authentication debugging with serializable error objects

### Backend CORS Configuration (Recommended)

For the Cloud Run backend at `https://document-intelligence-api-38231329931.us-central1.run.app`, update CORS configuration to include:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

## Development Workflow

### Starting the Frontend
```bash
# Ensure port 3000 is available
lsof -ti :3000 | xargs kill -9 2>/dev/null

# Start Next.js on port 3000 to match backend CORS
PORT=3000 npm run dev
```

### Backend CORS Settings
For development flexibility, consider these CORS origins:
- `http://localhost:3000` - Primary development port
- `http://localhost:3001` - Fallback port
- `http://127.0.0.1:3000` - Alternative localhost notation
- `http://127.0.0.1:3001` - Alternative localhost notation fallback

### Production Considerations
- In production, CORS should be restricted to the actual frontend domain
- Remove localhost origins from production CORS configuration
- Use environment-specific CORS configuration

## Error Logging Improvements

Enhanced authentication error logging now provides:
- HTTP status codes and messages
- Request URLs and methods
- Response data (when serializable)
- Request headers (with sensitive data redacted)
- Detailed error types and timing

This helps identify CORS issues, authentication failures, and network problems more effectively.