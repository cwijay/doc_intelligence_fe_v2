#!/bin/bash
# Parse .env.production and convert to Cloud Run environment variable format
# Output: --set-env-vars=KEY1=value1,KEY2=value2,...

set -e

ENV_FILE="${1:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Environment file $ENV_FILE not found" >&2
    exit 1
fi

# Read .env.production, filter out comments and empty lines, then format for Cloud Run
env_vars=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' | while IFS='=' read -r key value; do
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    # Skip if key or value is empty
    if [[ -z "$key" || -z "$value" ]]; then
        continue
    fi

    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    # Output in format: KEY=value
    echo "${key}=${value}"
done | paste -sd ',' -)

# Output the formatted environment variables
if [[ -n "$env_vars" ]]; then
    echo "$env_vars"
else
    echo "Error: No valid environment variables found in $ENV_FILE" >&2
    exit 1
fi
