#!/bin/bash

# Deployment script for Document Intelligence Frontend to Google Cloud Run
# Usage: ./deploy.sh --project-id YOUR_PROJECT_ID [options]

set -e  # Exit on any error

# Default values
PROJECT_ID="biz2bricks-dev-v1"
REGION="us-central1"
SERVICE_NAME="document-intelligence-frontend"
SKIP_BUILD=false
ENABLE_APIS=true
TAG=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Usage: $0 --project-id PROJECT_ID [options]

Deploy Document Intelligence Frontend to Google Cloud Run

Required arguments:
  --project-id PROJECT_ID    GCP Project ID

Optional arguments:
  --region REGION           GCP Region (default: us-central1)
  --service-name NAME       Cloud Run service name (default: document-intelligence-frontend)
  --tag TAG                 Docker image tag (default: timestamp)
  --skip-build             Skip building Docker image and use existing one
  --no-enable-apis         Skip enabling GCP APIs
  --help                   Show this help message

Examples:
  $0 --project-id my-project
  $0 --project-id my-project --region us-west1 --tag v1.0.0
  $0 --project-id my-project --skip-build
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --service-name)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-enable-apis)
            ENABLE_APIS=false
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$PROJECT_ID" ]]; then
    log_error "Project ID is required. Use --project-id YOUR_PROJECT_ID"
    show_help
    exit 1
fi

# Set default tag if not provided
if [[ -z "$TAG" ]]; then
    TAG=$(date +%Y%m%d-%H%M%S)
fi

# Docker image names
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
IMAGE_TAG="${IMAGE_NAME}:${TAG}"
LATEST_TAG="${IMAGE_NAME}:latest"

# API configuration
API_BASE_URL="https://document-intelligence-api-726919062103.us-central1.run.app"
API_URL="${API_BASE_URL}/api/v1"
RAG_API_BASE_URL="https://document-intelligence-ai-726919062103.us-central1.run.app"
RAG_API_URL="${RAG_API_BASE_URL}/api/v1/rag"
NEXT_PUBLIC_RAG_PROXY_BASE_URL="/api/rag"
NEXT_PUBLIC_RAG_PROXY_URL="/api/v1/rag"
EXCEL_API_URL="https://document-intelligence-ai-726919062103.us-central1.run.app/api/excel"
INGEST_API_EXTERNAL_BASE_URL="https://document-intelligence-ai-726919062103.us-central1.run.app"
INGEST_API_EXTERNAL_URL="${INGEST_API_EXTERNAL_BASE_URL}/api/v1/ingest"
INGEST_API_PROXY_BASE_URL="/api/ingest"

log_info "Starting deployment of ${SERVICE_NAME} to Cloud Run..."
log_info "Project ID: ${PROJECT_ID}"
log_info "Region: ${REGION}"
log_info "Image: ${IMAGE_TAG}"
echo "----------------------------------------"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install Google Cloud SDK."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker."
        exit 1
    fi
    
    # Check if authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "Not authenticated with gcloud. Run 'gcloud auth login'"
        exit 1
    fi
    
    # Set the project
    log_info "Setting project to ${PROJECT_ID}..."
    gcloud config set project "${PROJECT_ID}"
    
    log_success "Prerequisites check passed!"
}

# Enable required APIs
enable_apis() {
    if [[ "$ENABLE_APIS" == "true" ]]; then
        log_info "Enabling required APIs..."
        gcloud services enable cloudbuild.googleapis.com
        gcloud services enable run.googleapis.com
        gcloud services enable containerregistry.googleapis.com
        log_success "APIs enabled!"
    else
        log_info "Skipping API enablement..."
    fi
}

# Build and push Docker image
build_and_push_image() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_info "Skipping build, using existing image: ${LATEST_TAG}"
        return
    fi
    
    log_info "Building Docker image: ${IMAGE_TAG}"
    
    # Build the image with both tags for AMD64/Linux platform (required by Cloud Run)
    docker build --platform linux/amd64 -t "${IMAGE_TAG}" -t "${LATEST_TAG}" .
    
    # Configure Docker to use gcloud as credential helper
    log_info "Configuring Docker authentication..."
    gcloud auth configure-docker --quiet
    
    # Push both tags
    log_info "Pushing Docker image: ${IMAGE_TAG}"
    docker push "${IMAGE_TAG}"
    docker push "${LATEST_TAG}"
    
    log_success "Docker image pushed successfully!"
}

# Deploy to Cloud Run
deploy_to_cloudrun() {
    local image_to_deploy
    if [[ "$SKIP_BUILD" == "true" ]]; then
        image_to_deploy="${LATEST_TAG}"
    else
        image_to_deploy="${IMAGE_TAG}"
    fi
    
    log_info "Deploying to Cloud Run: ${SERVICE_NAME}"
    log_info "Using image: ${image_to_deploy}"
    
    # Deploy to Cloud Run with all configuration
    gcloud run deploy "${SERVICE_NAME}" \
        --image="${image_to_deploy}" \
        --region="${REGION}" \
        --platform=managed \
        --allow-unauthenticated \
        --port=3000 \
        --cpu=1 \
        --memory=512Mi \
        --min-instances=0 \
        --max-instances=10 \
        --timeout=300 \
        --concurrency=80 \
        --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,HOSTNAME=0.0.0.0" \
        --set-env-vars="NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}" \
        --set-env-vars="NEXT_PUBLIC_API_URL=${API_URL}" \
        --set-env-vars="NEXT_PUBLIC_RAG_API_BASE_URL=${NEXT_PUBLIC_RAG_PROXY_BASE_URL}" \
        --set-env-vars="NEXT_PUBLIC_RAG_API_URL=${NEXT_PUBLIC_RAG_PROXY_URL}" \
        --set-env-vars="NEXT_PUBLIC_EXCEL_API_URL=${EXCEL_API_URL}" \
        --set-env-vars="NEXT_PUBLIC_INGEST_API_BASE_URL=${INGEST_API_PROXY_BASE_URL}" \
        --set-env-vars="NEXT_PUBLIC_INGEST_API_URL=${INGEST_API_PROXY_BASE_URL}" \
        --set-env-vars="NEXT_PUBLIC_APP_NAME=biz-2-bricks-fe-v1,NEXT_PUBLIC_APP_VERSION=1.0.0" \
        --set-env-vars="NEXT_PUBLIC_USE_API_PROXY=true" \
        --set-env-vars="API_BASE_URL=${API_BASE_URL}" \
        --set-env-vars="API_URL=${API_URL}" \
        --set-env-vars="RAG_API_BASE_URL=${RAG_API_BASE_URL}" \
        --set-env-vars="RAG_API_URL=${RAG_API_URL}" \
        --set-env-vars="EXCEL_API_URL=${EXCEL_API_URL}" \
        --set-env-vars="INGEST_API_BASE_URL=${INGEST_API_EXTERNAL_BASE_URL}" \
        --set-env-vars="INGEST_API_URL=${INGEST_API_EXTERNAL_URL}"
    
    log_success "Deployment completed!"
}

# Get service URL
get_service_url() {
    log_info "Getting service URL..."
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
        --region="${REGION}" \
        --format="value(status.url)")
    
    if [[ -n "$SERVICE_URL" ]]; then
        log_success "Service URL: ${SERVICE_URL}"
        echo "SERVICE_URL=${SERVICE_URL}" > .deployment-info
    else
        log_error "Could not retrieve service URL"
        return 1
    fi
}

# Health check
health_check() {
    if [[ -z "$SERVICE_URL" ]]; then
        log_warning "Service URL not available, skipping health check"
        return
    fi
    
    log_info "Performing health check..."
    local health_url="${SERVICE_URL}/api/health"
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt ${attempt}/${max_attempts}..."
        
        if curl -f -s "${health_url}" > /dev/null 2>&1; then
            log_success "Health check passed! Service is healthy at ${SERVICE_URL}"
            return 0
        else
            log_warning "Health check failed, attempt ${attempt}/${max_attempts}"
            if [[ $attempt -lt $max_attempts ]]; then
                log_info "Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
        
        ((attempt++))
    done
    
    log_error "Health check failed after all attempts"
    return 1
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add any cleanup logic here if needed
}

# Main execution
main() {
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    enable_apis
    build_and_push_image
    deploy_to_cloudrun
    get_service_url
    
    echo "----------------------------------------"
    log_success "Deployment completed successfully!"
    log_success "Service URL: ${SERVICE_URL:-'Check Cloud Console'}"
    log_success "Image: ${IMAGE_TAG}"
    
    # Perform health check
    health_check
    
    echo "----------------------------------------"
    echo "Next steps:"
    echo "1. Visit your service at: ${SERVICE_URL:-'Check Cloud Console'}"
    echo "2. Set up custom domain if needed"
    echo "3. Configure monitoring and alerts"
    echo "4. Set up CI/CD pipeline with cloudbuild.yaml"
}

# Run main function
main "$@"
