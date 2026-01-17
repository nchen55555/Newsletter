#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const serviceName = process.argv[2] || 'company-importer';
const baseDir = `./services/${serviceName}`;

// File templates
const templates = {
  'package.json': {
    name: serviceName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vercel dev',
      deploy: 'vercel --prod'
    },
    dependencies: {
      '@sanity/client': '^6.22.2',
      'node-fetch': '^3.3.2',
      'dotenv': '^16.4.5'
    }
  },
  
  'vercel.json': {
    crons: [{
      path: '/api/cron',
      schedule: '0 2 * * *'
    }]
  },
  
  'api/cron.js': `export default async function handler(req, res) {
  // Verify this is coming from Vercel Cron
  const authHeader = req.headers.authorization || '';
  
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Import dynamically to avoid issues
    const { importCompanies } = await import('../lib/import.js');
    const result = await importCompanies();
    
    return res.status(200).json({ 
      success: true,
      imported: result.count,
      message: 'Companies imported successfully'
    });
  } catch (error) {
    console.error('Import failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
`,

  'lib/import.js': `import { createClient } from '@sanity/client';
import fetch from 'node-fetch';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function scrapeStartups() {
  const response = await fetch('https://startups.gallery');
  const html = await response.text();
  
  const companies = [];
  const seen = new Set();
  
  // Pattern to match company cards
  const pattern = /\\[!\\[\\]\\((https:\\/\\/[^)]+)\\)\\s*###\\s*([^\\n]+)\\s*([^\\n]+)\\./g;
  
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const [, imageUrl, title, caption] = match;
    const cleanTitle = title.trim();
    const cleanCaption = caption.trim();
    
    if (!seen.has(cleanTitle)) {
      companies.push({
        title: cleanTitle,
        caption: cleanCaption,
        image: imageUrl
      });
      seen.add(cleanTitle);
    }
  }
  
  return companies;
}

export async function importCompanies() {
  const companies = await scrapeStartups();
  let imported = 0;
  
  for (const company of companies) {
    // Check if already exists
    const existing = await sanityClient.fetch(
      \`*[_type == "company" && title == $title][0]\`,
      { title: company.title }
    );
    
    if (!existing) {
      // Download image
      const imageResponse = await fetch(company.image);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Upload to Sanity
      const filename = \`\${company.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg\`;
      const imageAsset = await sanityClient.assets.upload(
        'image',
        Buffer.from(imageBuffer),
        { filename }
      );
      
      // Create document
      await sanityClient.create({
        _type: 'company',
        title: company.title,
        caption: company.caption,
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id
          }
        }
      });
      
      imported++;
      console.log(\`✓ Imported \${company.title}\`);
    } else {
      console.log(\`⊘ Skipped \${company.title} (already exists)\`);
    }
  }
  
  return { count: imported };
}
`,

  '.env.example': `CRON_SECRET=your-random-secret-here
SANITY_PROJECT_ID=your-project-id
SANITY_DATASET=production
SANITY_TOKEN=your-write-token
`,

  '.gitignore': `.env
node_modules/
.vercel
`,

  'README.md': `# ${serviceName}

Node.js-based Vercel cron service for importing companies.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy \`.env.example\` to \`.env\` and fill in your values

3. Deploy to Vercel:
\`\`\`bash
npm run deploy
\`\`\`

## Environment Variables

Set these in Vercel Dashboard:
- \`CRON_SECRET\`: Random string for security
- \`SANITY_PROJECT_ID\`: Your Sanity project ID
- \`SANITY_DATASET\`: Usually 'production'
- \`SANITY_TOKEN\`: Sanity token with write permissions

## Cron Schedule

Currently set to run daily at 2 AM UTC.
Edit \`vercel.json\` to change schedule.

## Local Testing

\`\`\`bash
npm run dev
# Then visit http://localhost:3000/api/cron with Authorization header
\`\`\`

Or run the import directly:
\`\`\`bash
node -e "import('./lib/import.js').then(m => m.importCompanies())"
\`\`\`
`
};

// Create directories and files
function createService() {
  console.log(`Creating Node.js service: ${serviceName}\n`);
  
  // Create base directory
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Create subdirectories
  fs.mkdirSync(path.join(baseDir, 'api'), { recursive: true });
  fs.mkdirSync(path.join(baseDir, 'lib'), { recursive: true });
  
  // Write files
  Object.entries(templates).forEach(([filepath, content]) => {
    const fullPath = path.join(baseDir, filepath);
    const data = typeof content === 'string' 
      ? content 
      : JSON.stringify(content, null, 2);
    
    fs.writeFileSync(fullPath, data);
    console.log(`✓ Created ${filepath}`);
  });
  
  console.log(`\n✅ Service created at: ${baseDir}`);
  console.log(`\nNext steps:`);
  console.log(`1. cd ${baseDir}`);
  console.log(`2. npm install`);
  console.log(`3. cp .env.example .env (and fill in values)`);
  console.log(`4. npm run deploy (or 'vercel' to deploy)`);
}

createService();
