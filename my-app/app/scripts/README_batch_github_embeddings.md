# Batch GitHub Embeddings Generator

This script processes subscribers who already have GitHub analysis data (`github_url_data`) to generate vector embeddings for similarity matching and recommendations.

## Overview

The `batch_github_embeddings.py` script:
- Queries Supabase for subscribers with existing GitHub analysis data
- Sends this data to the `/api/github_embedding` endpoint to generate vector embeddings
- Updates subscriber records with embedding vectors for similarity search
- Provides detailed progress tracking and error reporting

**Important:** This script does NOT re-analyze GitHub profiles. It only generates embeddings from existing `github_url_data`.

## Prerequisites

1. **Python Dependencies:**
   ```bash
   pip install supabase aiohttp
   ```

2. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` must be set in your environment

3. **Service Role Key:**
   - You'll need your Supabase service role key (bypasses RLS for batch operations)

## Usage Examples

### Basic Usage
Generate embeddings for all subscribers with GitHub data:
```bash
python app/scripts/batch_github_embeddings.py --service-key YOUR_SERVICE_KEY
```

### Development/Testing
Preview what would be processed without making changes:
```bash
python app/scripts/batch_github_embeddings.py \
  --service-key YOUR_SERVICE_KEY \
  --dry-run \
  --limit 10
```

### Skip Existing Embeddings
Only process subscribers who don't already have embeddings:
```bash
python app/scripts/batch_github_embeddings.py \
  --service-key YOUR_SERVICE_KEY \
  --skip-existing
```

### Production Run (Recommended)
Process with conservative concurrency and skip existing:
```bash
python app/scripts/batch_github_embeddings.py \
  --service-key YOUR_SERVICE_KEY \
  --max-concurrent 3 \
  --skip-existing
```

### Large Dataset Processing
Process in batches with limits:
```bash
# First 100 subscribers
python app/scripts/batch_github_embeddings.py \
  --service-key YOUR_SERVICE_KEY \
  --limit 100 \
  --skip-existing

# Monitor progress and continue as needed
```

## Command Line Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `--service-key` | Required | - | Supabase service role key for authentication |
| `--dry-run` | Flag | False | Preview mode - shows what would be processed |
| `--limit` | Integer | None | Limit number of subscribers to process |
| `--skip-existing` | Flag | False | Skip subscribers who already have embeddings |
| `--base-url` | String | `http://localhost:3000` | Base URL for API calls |
| `--max-concurrent` | Integer | 5 | Maximum concurrent API requests |

## Output Example

```
🚀 Starting batch GitHub embeddings generation...
📊 Settings: limit=10, skip_existing=True, max_concurrent=3
🏃 Mode: LIVE

✅ Connected to Supabase with service role
📋 Fetched 8 subscribers with GitHub data
📋 Sample subscriber fields: ['id', 'first_name', 'last_name', 'github_url', 'github_url_data', 'github_vector_embeddings']

🔍 Processing johndoe (ID: 123, Name: John Doe)
🔍 Processing janedoe (ID: 124, Name: Jane Doe)
✅ User 123: johndoe - success
✅ User 124: janedoe - success

============================================================
📊 BATCH EMBEDDINGS SUMMARY
============================================================
✅ Successfully processed: 8
❌ Errors: 0
⏭️ Skipped: 0
📋 Total: 8

📈 Embedding Stats:
  - Embeddings generated: 8/8
  - Total similarity matches found: 40

🕐 Completed at: 2024-01-15 14:30:45
```

## Error Handling

The script handles various error scenarios:
- **Authentication errors:** Invalid service keys or missing permissions
- **API errors:** Rate limiting, timeouts, or malformed data
- **Database errors:** Connection issues or query failures
- **Data validation:** Missing or invalid GitHub analysis data

Errors are logged with details and don't stop processing of other subscribers.

## Performance Considerations

- **Concurrency:** Default of 5 concurrent requests. Lower for production stability
- **Rate limiting:** Built-in semaphore prevents overwhelming the API
- **Memory usage:** Processes subscribers in batches to avoid memory issues
- **API quotas:** Monitor Gemini API usage for embedding generation

## Troubleshooting

### Common Issues

1. **"supabase-py not installed"**
   ```bash
   pip install supabase
   ```

2. **"NEXT_PUBLIC_SUPABASE_URL environment variable is required"**
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   ```

3. **Authentication errors**
   - Verify your service role key is correct
   - Ensure the key has proper permissions for the `subscribers` table

4. **API timeout errors**
   - Reduce `--max-concurrent` value
   - Check network connectivity to your application

### Monitoring Progress

Use `--limit` for testing:
```bash
# Test with 5 subscribers first
python app/scripts/batch_github_embeddings.py \
  --service-key YOUR_SERVICE_KEY \
  --limit 5 \
  --dry-run
```

### Recovery from Interruption

The script supports `Ctrl+C` interruption and will show progress summary. Use `--skip-existing` to resume processing without duplicating work.

## Related Scripts

- `batch_github_analysis.py` - Analyzes GitHub profiles and generates `github_url_data`
- This script should be run AFTER `batch_github_analysis.py` to generate embeddings

## Security Notes

- Service role keys bypass Row Level Security (RLS) - use carefully
- Never commit service keys to version control
- Consider using environment variables or secure secret management