import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/lib/supabase';

// curl -X POST http://localhost:3000/api/generate-bio-from-linkedin/batch-process

export const runtime = "nodejs";

export async function POST() {
  try {
    console.log('Starting batch LinkedIn profile processing');

    // Fetch all subscribers with linkedin_url but without linkedin_embedding
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select('id, linkedin_url, first_name, last_name, scraped_linkedin')
      .not('linkedin_url', 'is', null)
      .is('linkedin_embeddings', null); // Only process those without embeddings

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscribers to process - all have embeddings already'
      });
    }

    console.log(`Found ${subscribers.length} subscribers without embeddings to process`);

    // Extract LinkedIn URLs
    // const linkedinUrls = subscribers.map(s => s.linkedin_url).filter(Boolean) as string[];

    // // Scrape all profiles in batch
    // const scrapedProfiles = await scrapeMultipleLinkedInProfiles(linkedinUrls);

    // if (scrapedProfiles.length === 0) {
    //   return NextResponse.json({
    //     error: 'Failed to scrape any profiles'
    //   }, { status: 500 });
    // }

    // console.log(`Scraped ${scrapedProfiles.length} profiles, processing...`);

    // // Process each scraped profile
    // const results = [];
    for (let i = 0; i < subscribers.length; i++) {
      const scraped_linkedin = subscribers[i].scraped_linkedin;
      const subscriber = subscribers[i];

      if (!scraped_linkedin || !subscriber) continue;

      try {
        console.log(`Processing subscriber ${subscriber.id}...`);

        // Update subscriber with scraped data
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({
            scraped_linkedin: scraped_linkedin,
          })
          .eq('id', subscriber.id);

        if (updateError) {
          console.error(`Failed to update subscriber ${subscriber.id}:`, updateError);
          // results.push({ subscriber_id: subscriber.id, success: false, error: updateError.message });
          continue;
        }

        // Generate LinkedIn embedding with retry logic
        const baseUrl = process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : process.env.BASE_URL;

        let embeddingSuccess = false;

        // Retry up to 3 times with exponential backoff
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Add delay to avoid rate limiting (2 seconds between calls)
            if (i > 0 || attempt > 0) {
              const delay = attempt === 0 ? 2000 : Math.pow(5, attempt) * 5000; // 2s, 10s, 20s
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            const embeddingResponse = await fetch(`${baseUrl}/api/linkedin_embedding`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                profileData: scraped_linkedin,
                subscriber_id: subscriber.id
              })
            });

            if (embeddingResponse.ok) {
              embeddingSuccess = true;
              console.log(`Successfully processed subscriber ${subscriber.id}`);
              break;
            } else if (embeddingResponse.status === 429) {
              // Rate limited - will retry with backoff
              console.log(`Rate limited for subscriber ${subscriber.id}, retry ${attempt + 1}/3`);
              continue;
            } else {
              const errorText = await embeddingResponse.text();
              console.error(`Failed to generate embedding for subscriber ${subscriber.id}:`, errorText);
              break;
            }
          } catch (error) {
            console.error(`Error generating embedding for subscriber ${subscriber.id}, attempt ${attempt + 1}:`, error);
            if (attempt < 2) continue;
          }
        }

        if (!embeddingSuccess) {
          console.error(`Failed to generate embedding for subscriber ${subscriber.id} after 3 attempts`);
        }

      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Batch processing error:', error);
    return NextResponse.json({
      error: 'Batch processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
