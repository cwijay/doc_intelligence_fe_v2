# GCP Cloud Run Deployment Guide

This guide covers deploying the Document Intelligence Frontend to Google Cloud Run.

## Files Created

- **Dockerfile** - Multi-stage build for production deployment
- **.dockerignore** - Optimizes Docker build context
- **.env.production** - Production environment variables
- **cloudbuild.yaml** - Cloud Build CI/CD configuration
- **deploy.sh** - Shell script for manual deployment
- **DEPLOYMENT.md** - This deployment guide

## Quick Deployment

### Option 1: Using Shell Script (Recommended)

```bash
# Deploy to your GCP project
./deploy.sh --project-id YOUR_PROJECT_ID

# Deploy with custom options
./deploy.sh --project-id YOUR_PROJECT_ID --region us-west1 --tag v1.0.0

# Skip building and use existing image
./deploy.sh --project-id YOUR_PROJECT_ID --skip-build
```

### Option 2: Using npm Scripts

```bash
# Deploy using shell script
npm run deploy:gcp -- --project-id YOUR_PROJECT_ID

# Deploy using Cloud Build
npm run deploy:build
```

### Option 3: Using Cloud Build (CI/CD)

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Prerequisites

1. **Google Cloud SDK**: Install and authenticate
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Docker**: Install Docker Desktop and ensure it's running

3. **Required APIs**: The script will enable these automatically
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

## Deployment Configuration

### Environment Variables

**IMPORTANT**: All production environment variables are now managed in `.env.production` file.

The deployment automatically reads from `.env.production` and applies all variables to Cloud Run. This ensures:
- ✅ Single source of truth for production configuration
- ✅ No hardcoded values in `cloudbuild.yaml`
- ✅ Easy updates - just edit `.env.production` and redeploy

**How it works:**
1. `scripts/parse-env.sh` reads `.env.production`
2. Converts to Cloud Run format: `KEY1=value1,KEY2=value2,...`
3. Applies all variables during deployment

**To update environment variables:**
1. Edit `.env.production` with your values
2. Run deployment command
3. Cloud Build automatically applies the new configuration

Example `.env.production`:
```env
# Client-side variables
NEXT_PUBLIC_API_BASE_URL=https://your-api.run.app
NEXT_PUBLIC_API_URL=https://your-api.run.app/api/v1
NEXT_PUBLIC_APP_NAME=Biz-To-Bricks

# Server-side variables
API_BASE_URL=https://your-api.run.app
API_URL=https://your-api.run.app/api/v1
```

### Cloud Run Configuration

- **CPU**: 1 vCPU
- **Memory**: 512Mi
- **Port**: 3000
- **Min Instances**: 0 (scales to zero)
- **Max Instances**: 10
- **Timeout**: 300 seconds
- **Concurrency**: 80 requests per instance

## Known Issues & Workarounds

### 1. Build Issues with useSearchParams() - FIXED ✅

**Issue**: The app uses `useSearchParams()` which can cause build failures during static generation.

**Resolution**: Added proper Suspense boundary in the users page component. The component that uses `useSearchParams()` is now wrapped with `<Suspense>` boundary, allowing the build to complete successfully.

### 2. Cloud Run Reserved Environment Variables - FIXED ✅

**Issue**: Cloud Run reserves certain environment variables like `PORT` and automatically sets them.

**Resolution**: Removed `PORT` from deployment configuration since Cloud Run manages this automatically. The application will use Cloud Run's assigned port.

### 3. Docker Platform Compatibility - FIXED ✅

**Issue**: Docker images built on Apple Silicon (M1/M2) Macs create multi-platform manifests that Cloud Run doesn't support.

**Resolution**: Added `--platform linux/amd64` flag to all Docker build commands to ensure compatibility with Cloud Run's AMD64/Linux requirement.

### 4. ESLint and TypeScript Warnings

**Issue**: The codebase has unused variables and type issues that prevent clean builds.

**Current Workaround**: Build configuration ignores these during deployment.

**Production Fix**: Clean up unused imports and fix type issues.

## Docker Local Testing

```bash
# Build the image locally
npm run docker:build

# Run locally
npm run docker:run

# Test the application
open http://localhost:3000
```

## Deployment Script Options

The `deploy.sh` script supports these options:

- `--project-id`: GCP Project ID (required)
- `--region`: GCP Region (default: us-central1)
- `--service-name`: Cloud Run service name (default: document-intelligence-frontend)
- `--tag`: Docker image tag (default: timestamp)
- `--skip-build`: Skip building Docker image
- `--no-enable-apis`: Skip enabling GCP APIs
- `--help`: Show help message

## Post-Deployment

After successful deployment:

1. **Service URL**: The script will output the Cloud Run service URL
2. **Health Check**: Automatic health check against `/api/health`
3. **Custom Domain**: Configure if needed via Cloud Console
4. **Monitoring**: Set up logging and monitoring
5. **CI/CD Pipeline**: Configure GitHub triggers with `cloudbuild.yaml`

## Troubleshooting

### Build Failures

If the build fails with React/Next.js errors:
1. Check the specific error in the build logs
2. Consider adding more build error ignores to `next.config.ts`
3. Use `--skip-build` flag if Docker image exists

### Deployment Failures

If deployment fails:
1. Verify GCP authentication: `gcloud auth list`
2. Check project permissions
3. Verify APIs are enabled
4. Check Cloud Run service logs in GCP Console

### Runtime Issues

If the app doesn't work after deployment:
1. Check Cloud Run logs in GCP Console
2. Verify environment variables are set correctly
3. Test API connectivity from the deployed service
4. Check that the backend API is accessible from Cloud Run

## Security Considerations

The deployment includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block

## Next Steps

1. **Fix Build Issues**: Address useSearchParams and TypeScript issues
2. **Add Tests**: Implement unit and integration tests
3. **CI/CD Pipeline**: Set up automated deployments
4. **Monitoring**: Add application monitoring and alerts
5. **Custom Domain**: Configure a custom domain name
6. **SSL Certificate**: Ensure HTTPS is properly configured

## Support

For deployment issues:
1. Check GCP Cloud Console for detailed error logs
2. Review the deployment script output
3. Verify all prerequisites are met
4. Test locally with Docker before deploying