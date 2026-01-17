import { createClient } from '@sanity/client';
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
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  
  console.log('Loading startups.gallery...');
  await page.goto('https://startups.gallery', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  console.log('Extracting company links...');
  const companyLinks = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const links = document.querySelectorAll('a[href*="/companies/"]');
    
    links.forEach(link => {
      const titleEl = link.querySelector('h3');
      const title = titleEl?.textContent?.trim();
      const imgEl = link.querySelector('img');
      const image = imgEl?.src;
      const href = link.getAttribute('href');
      
      // Get the short caption from the main page
      let caption = '';
      const paragraphs = link.querySelectorAll('p');
      if (paragraphs.length > 0) {
        for (const p of paragraphs) {
          const text = p.textContent?.trim() || '';
          // Skip metadata, get the description
          if (!text.includes('·') && !text.includes('Based in') && text.length > 10) {
            caption = text;
            break;
          }
        }
      }
      
      // If no caption found, try getting it from text content
      if (!caption) {
        const allText = link.textContent || '';
        const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          caption = lines[1];
        }
      }
      
      // Only add if we have title, image, and href
      if (title && image && href && caption && !seen.has(title)) {
        // Normalize the href - remove leading ./ if present
        const normalizedHref = href.startsWith('./') ? href.substring(2) : href;
        const fullUrl = href.startsWith('http') 
          ? href 
          : `https://startups.gallery/${normalizedHref}`;
        
        results.push({
          title,
          caption, // Short description from main page
          image,
          href: fullUrl
        });
        seen.add(title);
      }
    });
    
    return results;
  });
  
  console.log(`Found ${companyLinks.length} company links`);
  
  // Limit to avoid timeout (adjust as needed)
  const MAX_COMPANIES = 50;
  const linksToScrape = companyLinks.slice(0, MAX_COMPANIES);
  console.log(`Processing first ${linksToScrape.length} companies`);
  
  const companies = [];
  
  // Visit each company page to get full description
  for (const link of linksToScrape) {
    try {
      console.log(`Scraping ${link.title}...`);
      
      await page.goto(link.href, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      // Verify we're still on startups.gallery
      const currentUrl = page.url();
      if (!currentUrl.includes('startups.gallery')) {
        console.log(`⚠️  Skipped ${link.title} - not on startups.gallery (${currentUrl})`);
        continue;
      }
      
      // Extract the full description from the company page
      const description = await page.evaluate(() => {
        // Strategy: Find the location icon SVG, then get the paragraph right before it
        
        // Find the SVG with the location icon
        const locationSvg = Array.from(document.querySelectorAll('svg use[href="#svg8851667150"]'))
          .map(use => use.closest('svg'))
          .find(svg => svg);
        
        if (locationSvg) {
          // Get all paragraphs
          const paragraphs = Array.from(document.querySelectorAll('p'));
          
          // Find which paragraph comes right before the SVG
          for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            
            // Check if the SVG comes after this paragraph in DOM order
            const comparison = p.compareDocumentPosition(locationSvg);
            
            // If SVG follows this paragraph (bit 4 = DOCUMENT_POSITION_FOLLOWING)
            if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
              // Check if the next sibling contains or is near the SVG
              // Get all elements between this p and the SVG
              let current = p.nextElementSibling;
              let foundSvg = false;
              let steps = 0;
              
              while (current && steps < 5) { // Check next 5 siblings max
                if (current.contains(locationSvg) || current === locationSvg) {
                  foundSvg = true;
                  break;
                }
                current = current.nextElementSibling;
                steps++;
              }
              
              if (foundSvg) {
                const text = p.textContent?.trim() || '';
                // Validate it's a real description
                if (text.length > 30 && 
                    !text.includes('·') && 
                    !text.includes('Series') &&
                    !text.includes('Hiring') &&
                    !text.includes('Founded')) {
                  return text;
                }
              }
            }
          }
        }
        
        // Fallback: traditional method
        const paragraphs = Array.from(document.querySelectorAll('p'));
        for (const p of paragraphs) {
          const text = p.textContent?.trim() || '';
          if (text.length > 50 && 
              !text.includes('·') && 
              !text.includes('Series') && 
              !text.includes('Based in') &&
              !text.includes('Hiring') &&
              !text.includes('Founded') &&
              !text.includes('Learn more') &&
              !text.includes('Visit website')) {
            return text;
          }
        }
        
        return 'No description available';
      });
      
      console.log(`Description for ${link.title}: ${description.substring(0, 100)}...`);

      
      // Only add if we got a valid description
      if (description && description !== 'No description available') {
        companies.push({
          alt: link.title,
          caption: link.caption, // Short text from main page
          description: description, // Detailed text from company page
          image: link.image
        });
        console.log(`✓ Extracted description for ${link.title}`);
      } else {
        console.log(`⚠️  No description found for ${link.title}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error scraping ${link.title}:`, error.message);
      continue;
    }
  }
  
  await browser.close();
  
  console.log(`✓ Successfully extracted ${companies.length} companies with descriptions`);
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
    // VALIDATION BEFORE IMPORTING - skip if missing required data
    if (!company.alt || !company.caption || !company.description || !company.image) {
      console.log(`⊘ Skipped company with missing data (alt: ${company.alt || 'undefined'})`);
      continue;
    }
    
    // Check if already exists to get the existing ID and company number
    const existing = await sanityClient.fetch(
      `*[_type == "mediaLibrary" && alt == $alt][0]{ _id, company }`,
      { alt: company.alt }
    );

    try {
      // Download image
      const imageResponse = await fetch(company.image);
      if (!imageResponse.ok) {
        console.log(`⚠️  Failed to fetch image for ${company.alt}`);
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
      
      // Use existing company number if found, otherwise create new
      const companyNumber = existing?.company || nextCompanyNumber;
      
      if (existing) {
        // For existing documents, use patch to update fields
        console.log(`Updating existing document ${existing._id}...`);
  
      // For existing documents, use patch to update fields
      const patchResult = await sanityClient
        .patch(existing._id)
        .set({
          alt: company.alt,
          caption: company.caption,
          description: company.description, // Make sure this field exists in schema
          publishedAt: new Date().toISOString(),
          image: {
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: imageAsset._id
            }
          }
        })
        .commit();
      
      imported++;
      } else {
        // For new documents, use createOrReplace with explicit ID
        await sanityClient.createOrReplace({
          _id: `media-library-${nextCompanyNumber}`,
          _type: 'mediaLibrary',
          company: nextCompanyNumber,
          alt: company.alt,
          caption: company.caption,
          description: company.description,
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
        console.log(`✓ Imported ${company.alt} (Company #${companyNumber})`);
      }
      
      imported++;
    } catch (error) {
      console.error(`❌ Error importing ${company.alt}:`, error.message);
      console.error('Full error:', error); // More detailed error logging
    }
  }
  return { count: imported };
}
