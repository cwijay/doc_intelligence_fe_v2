#!/bin/bash
# =============================================================================
# Setup Cloud Build Triggers for Frontend
# =============================================================================
# Creates GitHub-connected Cloud Build triggers for automated deployments.
#
# Prerequisites:
#   1. GitHub repository connected to Cloud Build
#   2. gcloud CLI authenticated with appropriate permissions
#   3. Cloud Build API enabled
#
# Usage:
#   ./scripts/gcp/setup_triggers.sh
#   ./scripts/gcp/setup_triggers.sh --project=my-project --repo=my-org/my-repo
# =============================================================================

set -e

# Default configuration
PROJECT_ID="${PROJECT_ID:-biz2bricks-dev-v1}"
GITHUB_REPO="${GITHUB_REPO:-chaminda/document_intelligence_fe_v2}"
REGION="us-central1"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project=*)
            PROJECT_ID="${1#*=}"
            shift
            ;;
        --repo=*)
            GITHUB_REPO="${1#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [--project=PROJECT_ID] [--repo=GITHUB_OWNER/REPO]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "============================================="
echo "Setting up Cloud Build Triggers for Frontend"
echo "============================================="
echo "Project: $PROJECT_ID"
echo "GitHub Repo: $GITHUB_REPO"
echo ""

# Extract owner and repo name
REPO_OWNER=$(echo "$GITHUB_REPO" | cut -d'/' -f1)
REPO_NAME=$(echo "$GITHUB_REPO" | cut -d'/' -f2)

# Set the project
gcloud config set project "$PROJECT_ID"

# -----------------------------------------------------------------------------
# Development Trigger (develop branch)
# -----------------------------------------------------------------------------
echo "Creating development trigger..."

# Check if trigger exists
if gcloud builds triggers describe frontend-dev-deploy --region="$REGION" &>/dev/null; then
    echo "  Trigger 'frontend-dev-deploy' already exists. Updating..."
    gcloud builds triggers delete frontend-dev-deploy --region="$REGION" --quiet
fi

gcloud builds triggers create github \
    --name="frontend-dev-deploy" \
    --region="$REGION" \
    --repo-owner="$REPO_OWNER" \
    --repo-name="$REPO_NAME" \
    --branch-pattern="^develop$" \
    --build-config="cloudbuild.yaml" \
    --description="Deploy Frontend to development environment on develop branch push"

echo "  Created trigger: frontend-dev-deploy"

# -----------------------------------------------------------------------------
# Production Trigger (master branch)
# -----------------------------------------------------------------------------
echo "Creating production trigger..."

# Check if trigger exists
if gcloud builds triggers describe frontend-prod-deploy --region="$REGION" &>/dev/null; then
    echo "  Trigger 'frontend-prod-deploy' already exists. Updating..."
    gcloud builds triggers delete frontend-prod-deploy --region="$REGION" --quiet
fi

# Note: Production API URLs need to be updated after production services are deployed
gcloud builds triggers create github \
    --name="frontend-prod-deploy" \
    --region="$REGION" \
    --repo-owner="$REPO_OWNER" \
    --repo-name="$REPO_NAME" \
    --branch-pattern="^master$" \
    --build-config="cloudbuild.yaml" \
    --substitutions="_ENV=prod,_SERVICE_NAME=document-intelligence-ui-prod,_MAX_INSTANCES=10" \
    --description="Deploy Frontend to production environment on master branch push"

echo "  Created trigger: frontend-prod-deploy"
echo ""
echo "  NOTE: Update production trigger with correct API URLs after deploying production backend services:"
echo "    gcloud builds triggers update frontend-prod-deploy --region=$REGION \\"
echo "      --update-substitutions=_BACKEND_API_URL=https://document-intelligence-api-prod-xxx.run.app,_AI_API_URL=https://document-intelligence-ai-api-prod-xxx.run.app"

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo ""
echo "============================================="
echo "Triggers Created Successfully!"
echo "============================================="
echo ""
echo "Triggers:"
gcloud builds triggers list --region="$REGION" --filter="name~frontend" --format="table(name,description)"
echo ""
echo "Next steps:"
echo "  1. Push to 'develop' branch to trigger dev deployment"
echo "  2. Push to 'master' branch to trigger prod deployment"
echo ""
echo "Manual trigger:"
echo "  gcloud builds triggers run frontend-dev-deploy --region=$REGION --branch=develop"
echo "  gcloud builds triggers run frontend-prod-deploy --region=$REGION --branch=master"
