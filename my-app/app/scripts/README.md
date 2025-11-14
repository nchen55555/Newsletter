# Batch GitHub Analysis Script

This script processes all subscribers with GitHub URLs to analyze their profiles and generate embeddings.

## Setup

1. Ensure your Next.js app is running:
```bash
npm run dev  # Should be running on http://localhost:3000
```

2. Install Python dependencies:
```bash
pip install aiohttp
```

## Usage

### Basic Usage
```bash
# Required: service role key for authentication
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVib21wanNsY2ZnYmtpZG1mdXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg3NjYyMiwiZXhwIjoyMDY4NDUyNjIyfQ.q7p1OvO1bDTXREHNXc7MUURpmdcgsIVCeLmPmUL-XhY"

# Process all subscribers with GitHub URLs
python app/scripts/batch_github_analysis.py --service-key "$SERVICE_KEY"

# Dry run to see what would be processed
python app/scripts/batch_github_analysis.py --service-key "$SERVICE_KEY" --dry-run

# Process only first 10 subscribers
python app/scripts/batch_github_analysis.py --service-key "$SERVICE_KEY" --limit 10

# Skip subscribers who already have embeddings
python app/scripts/batch_github_analysis.py --service-key "$SERVICE_KEY" --skip-existing
```

### Advanced Options
```bash
# Full command with all options
python app/scripts/batch_github_analysis.py \
  --service-key "$SERVICE_KEY" \
  --dry-run \
  --limit 50 \
  --skip-existing \
  --max-concurrent 3 \
  --base-url http://localhost:3000
```

## Options

- `--service-key KEY`: **Required** - Supabase service role key for authentication
- `--dry-run`: Preview what would be processed without making changes
- `--limit N`: Limit number of subscribers to process
- `--skip-existing`: Skip subscribers who already have GitHub embeddings
- `--base-url URL`: API base URL (default: http://localhost:3000)
- `--max-concurrent N`: Maximum concurrent API calls (default: 5)

## What it does

1. **Fetches subscribers** with GitHub URLs from Supabase
2. **Extracts GitHub usernames** from URLs
3. **Analyzes GitHub profiles** using the existing `/api/analyze-github-profile` endpoint
4. **Generates embeddings** using the existing `/api/github_embedding` endpoint
5. **Updates Supabase records** with analysis data and embeddings

## Output

The script provides real-time progress updates and a final summary:

```
🚀 Starting batch GitHub analysis...
📊 Settings: limit=10, skip_existing=True, max_concurrent=5
🏃 Mode: LIVE

📋 Found 25 subscribers to process

✅ User 123: johndoe - success
✅ User 124: janedoe - success
⏭️ User 125: existing_user - skipped
❌ User 126: invalid_user - error
   Error: GitHub user not found

============================================================
📊 BATCH PROCESSING SUMMARY
============================================================
✅ Successfully processed: 15
❌ Errors: 2
⏭️ Skipped: 8
📋 Total: 25

📈 Analysis Stats:
  - Total repositories analyzed: 245
  - Embeddings generated: 15/15

🕐 Completed at: 2025-01-13 14:30:25
```

## Error Handling

The script handles various error scenarios:
- Invalid GitHub URLs
- Non-existent GitHub users
- API rate limits
- Network timeouts
- Missing environment variables

## Notes

- Uses existing API endpoints, so all authentication and rate limiting is handled
- Respects GitHub API limits through the existing analysis pipeline
- Can be safely interrupted with Ctrl+C
- Always shows a summary of what was processed