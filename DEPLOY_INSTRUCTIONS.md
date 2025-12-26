# Deployment Instructions for biz2bricks-dev-v1

## Quick Start

### Step 1: Authenticate
```bash
gcloud auth login
gcloud config set project biz2bricks-dev-v1
```

### Step 2: Deploy with Cloud Build (Recommended)
```bash
cd /Users/chamindawijayasundara/Documents/biz_to_bricks/document_intelligence_fe_v1
gcloud builds submit --config cloudbuild.yaml --project biz2bricks-dev-v1
```

**Expected duration**: 5-10 minutes

**What this does**:
- Builds Docker image on GCP infrastructure
- Pushes to Artifact Registry: `us-central1-docker.pkg.dev/biz2bricks-dev-v1/document-intelligence/frontend`
- Deploys to Cloud Run service: `document-intelligence-frontend`
- Region: `us-central1`

---

## Alternative: Manual Deployment Script

```bash
./deploy.sh --project-id biz2bricks-dev-v1
```

This uses the local deployment script with all configurations already set.

---

## Configuration Summary

### API Endpoints (from .env.production)
- **Main API**: `https://document-intelligence-api-726919062103.us-central1.run.app`
- **AI/Excel API**: `https://document-intelligence-ai-726919062103.us-central1.run.app`
- **Proxy Routes**: `/api/ingest`, `/api/rag`

### Cloud Run Configuration
- **Service Name**: `document-intelligence-frontend`
- **Region**: `us-central1`
- **Port**: `3000`
- **CPU**: `1 vCPU`
- **Memory**: `512Mi`
- **Min Instances**: `0` (scales to zero)
- **Max Instances**: `10`
- **Concurrency**: `80 requests/instance`
- **Timeout**: `300 seconds`

### Environment Variables Set
All environment variables from `.env.production` are automatically configured:
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_EXCEL_API_URL`
- `NEXT_PUBLIC_INGEST_API_BASE_URL`
- `NEXT_PUBLIC_INGEST_API_URL`
- `NEXT_PUBLIC_RAG_API_BASE_URL`
- `NEXT_PUBLIC_RAG_API_URL`
- `NEXT_PUBLIC_USE_API_PROXY=true`
- `NEXT_PUBLIC_APP_NAME=biz-2-bricks-fe-v1`
- `NEXT_PUBLIC_APP_VERSION=1.0.0`
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`
- `HOSTNAME=0.0.0.0`

And corresponding server-side variables.

---

## After Deployment

### Get Service URL
```bash
gcloud run services describe document-intelligence-frontend \
  --region=us-central1 \
  --format="value(status.url)"
```

### View Logs
```bash
gcloud run services logs read document-intelligence-frontend \
  --region=us-central1 \
  --limit=50
```

### Test Health Endpoint
```bash
SERVICE_URL=$(gcloud run services describe document-intelligence-frontend --region=us-central1 --format="value(status.url)")
curl ${SERVICE_URL}/api/health
```

---

## Troubleshooting

### Build Fails
- Check Cloud Build logs: https://console.cloud.google.com/cloud-build/builds?project=biz2bricks-dev-v1
- Verify Artifact Registry exists: `us-central1-docker.pkg.dev/biz2bricks-dev-v1/document-intelligence`

### Deployment Fails
- Check Cloud Run logs in GCP Console
- Verify all APIs are enabled:
  ```bash
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable artifactregistry.googleapis.com
  ```

### Authentication Issues
If you get auth token errors:
```bash
gcloud auth login
gcloud auth application-default login
```

---

## Monitoring & Management

### Cloud Console Links
- **Cloud Run**: https://console.cloud.google.com/run?project=biz2bricks-dev-v1
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=biz2bricks-dev-v1
- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=biz2bricks-dev-v1

### Update Environment Variables
```bash
gcloud run services update document-intelligence-frontend \
  --region=us-central1 \
  --set-env-vars="KEY=VALUE"
```

### Scale Configuration
```bash
gcloud run services update document-intelligence-frontend \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=20
```

---

## Files Updated
- ✅ `deploy.sh` - Project ID and API URLs synced with .env.production
- ✅ `cloudbuild.yaml` - Project ID and API URLs synced with .env.production
- ✅ `.env.production` - Verified correct API endpoints

---

## Next Steps After Successful Deployment

1. **Get the service URL** and test it in browser
2. **Test authentication flow** - Register/Login
3. **Verify API connectivity** - Upload a document, test AI features
4. **Set up custom domain** (optional)
5. **Configure monitoring and alerts** in GCP Console
6. **Set up CI/CD** - Connect GitHub repo to Cloud Build for automatic deployments
