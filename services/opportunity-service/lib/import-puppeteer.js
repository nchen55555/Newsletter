import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01'
});

async function scrapeStartups() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(), // comes from the package
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  
  console.log('Loading startups.gallery...');
  await page.goto('https://startups.gallery', {
    waitUntil: 'networkidle2', // Wait for all network requests to finish
    timeout: 30000
  });
  
  console.log('Extracting company data...');
  const companies = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    
    // Find all company links
    const links = document.querySelectorAll('a[href*="/companies/"]');
    
    links.forEach(link => {
      // Get title from h3
      const titleEl = link.querySelector('h3');
      const title = titleEl?.textContent?.trim();
      
      // Get image
      const imgEl = link.querySelector('img');
      const image = imgEl?.src;
      
      // Get caption - usually the first <p> or text after h3
      let caption = '';
      const paragraphs = link.querySelectorAll('p');
      if (paragraphs.length > 0) {
        // Find the one that looks like a description (not metadata)
        for (const p of paragraphs) {
          const text = p.textContent?.trim() || '';
          // Skip if it looks like metadata (has "·" or "Series A", etc)
          if (!text.includes('·') && !text.includes('Based in') && text.length > 10) {
            caption = text;
            break;
          }
        }
      }
      
      // If no caption in <p>, try getting text content
      if (!caption) {
        const allText = link.textContent || '';
        const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
        // Caption is usually after the title
        if (lines.length >= 2) {
          caption = lines[1];
        }
      }
      
      if (title && image && !seen.has(title)) {
        results.push({
          alt: title,
          caption: caption || 'No description available',
          image
        });
        seen.add(title);
      }
    });
    
    return results;
  });
  
  await browser.close();
  
  console.log(`✓ Extracted ${companies.length} companies`);
  return companies;
}

export async function importCompanies() {
  const companies = await scrapeStartups();
  
  if (companies.length === 0) {
    console.log('⚠️  No companies found - scraping may have failed');
    return { count: 0 };
  }
  
  // Get the highest existing company number
  const highestCompany = await sanityClient.fetch(
    `*[_type == "mediaLibrary"] | order(company desc)[0].company`
  );
  
  let nextCompanyNumber = (highestCompany || 0) + 1;
  let imported = 0;
  
  for (const company of companies) {
    // Check if already exists
    const existing = await sanityClient.fetch(
      `*[_type == "mediaLibrary" && alt == $alt][0]`,
      { alt: company.alt }
    );
    
    if (!existing) {
      try {
        // Download image
        const imageResponse = await fetch(company.image);
        if (!imageResponse.ok) {
          console.log(`⚠️  Failed to fetch image for ${company.title}`);
          continue;
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Upload to Sanity
        const filename = `${company.alt.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`;
        const imageAsset = await sanityClient.assets.upload(
          'image',
          Buffer.from(imageBuffer),
          { filename }
        );
        
        // Create document
        await sanityClient.create({
          _type: 'mediaLibrary',
          company: nextCompanyNumber,
          alt: company.alt,
          caption: company.caption,
          publishedAt: new Date().toISOString(),
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: imageAsset._id
            }
          }
        });
        
        nextCompanyNumber++;
        imported++;
        console.log(`✓ Imported ${company.alt} (Company #${nextCompanyNumber - 1})`);
      } catch (error) {
        console.error(`❌ Error importing ${company.title}:`, error.message);
      }
    } else {
      console.log(`⊘ Skipped ${company.title} (already exists)`);
    }
  }
  
  return { count: imported };
}
