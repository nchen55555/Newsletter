# opportunity-service

Node.js-based Vercel cron service for importing companies.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values

3. Deploy to Vercel:
```bash
npm run deploy
```

## Environment Variables

Set these in Vercel Dashboard:
- `CRON_SECRET`: Random string for security
- `SANITY_PROJECT_ID`: Your Sanity project ID
- `SANITY_DATASET`: Usually 'production'
- `SANITY_TOKEN`: Sanity token with write permissions

## Cron Schedule

Currently set to run daily at 2 AM UTC.
Edit `vercel.json` to change schedule.

## Local Testing

```bash
npm run dev
# Then visit http://localhost:3000/api/cron with Authorization header
```

Or run the import directly:
```bash
node -e "import('./lib/import.js').then(m => m.importCompanies())"
```
