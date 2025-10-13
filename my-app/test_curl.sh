#!/bin/bash

# Test curl command for Google Calendar API endpoint
# Replace YOUR_SESSION_TOKEN with your actual session token when testing locally
curl -X GET "http://localhost:3000/api/google/calendar/interviews?domains=theniche.tech" \
  -H "Cookie: sb-ubompjslcfgbkidmfuym-auth-token=[\"YOUR_SESSION_TOKEN\",\"YOUR_REFRESH_TOKEN\",\"YOUR_ACCESS_TOKEN\",\"YOUR_REFRESH_TOKEN\",null]" \
  -H "Content-Type: application/json"

# Note: This file should never contain real tokens in version control
# Use environment variables or copy your tokens manually when testing