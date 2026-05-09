#!/bin/bash
# Push changes to GitHub (triggers Netlify auto-deploy to meridianhealth.com.au)

if [ -z "$GITHUB_DEPLOY_TOKEN" ]; then
  echo "ERROR: GITHUB_DEPLOY_TOKEN secret is not set."
  exit 1
fi

REPO="https://x-access-token:${GITHUB_DEPLOY_TOKEN}@github.com/Meridian-GI-Metabolic/meridianhealth.git"

echo "Pushing to GitHub..."
git push --force "$REPO" main

if [ $? -eq 0 ]; then
  echo ""
  echo "Done. Netlify will now auto-deploy to meridianhealth.com.au."
  exit 0
else
  echo ""
  echo "Push failed. Check your GITHUB_DEPLOY_TOKEN has write access to the repo."
  exit 1
fi
