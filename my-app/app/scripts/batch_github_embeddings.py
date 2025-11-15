#!/usr/bin/env python3
"""
Batch GitHub Embeddings Script
===============================

This script processes subscribers who have github_url_data to:
1. Generate embeddings using existing GitHub analysis data
2. Update their Supabase records with vector embeddings

Usage:
    python app/scripts/batch_github_embeddings.py --service-key YOUR_SERVICE_KEY [--dry-run] [--limit N] [--skip-existing]
"""

import asyncio
import aiohttp
import json
import argparse
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class BatchGitHubEmbeddingsProcessor:
    def __init__(self, base_url: str = "http://localhost:3000", dry_run: bool = False, service_role_key: str = None):
        self.base_url = base_url
        self.dry_run = dry_run
        self.service_role_key = service_role_key
        self.processed_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.results = []

    async def get_subscribers_with_github_data(self, session: aiohttp.ClientSession, limit: Optional[int] = None, skip_existing: bool = False) -> List[Dict]:
        """Fetch subscribers who have github_url_data but might not have embeddings yet."""
        try:
            params = {}
            if limit:
                params['limit'] = limit
            if skip_existing:
                params['skip_existing'] = 'true'
            
            headers = {}
            if self.service_role_key:
                headers['authorization'] = f'Bearer {self.service_role_key}'
                
            # Use the existing API endpoint (we'll need to create this)
            async with session.get(f"{self.base_url}/api/get_subscribers_with_github_data", 
                                 params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    subscribers = data.get('subscribers', [])
                    print(f"📋 Fetched {len(subscribers)} subscribers with GitHub data")
                    # Log sample of what fields we have
                    if subscribers:
                        sample = subscribers[0]
                        print(f"📋 Sample subscriber fields: {list(sample.keys())}")
                    return subscribers
                else:
                    print(f"❌ Failed to fetch subscribers: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error fetching subscribers: {e}")
            return []

    async def generate_embedding(self, session: aiohttp.ClientSession, subscriber_id: int, github_data: Dict) -> Dict:
        """Generate embedding for GitHub data using the existing API"""
        try:
            payload = {
                "data": github_data,
                "subscriberId": subscriber_id
            }
            
            if self.dry_run:
                print(f"🔍 [DRY RUN] Would generate embedding for user {subscriber_id}")
                return {"success": True, "dry_run": True}
            
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.service_role_key}"
            }
            
            async with session.post(f"{self.base_url}/api/github_embedding", 
                                  json=payload, headers=headers) as response:
                result = await response.json()
                
                if response.status == 200 and result.get('success'):
                    return {
                        "success": True,
                        "embedding_generated": result.get('embeddingGenerated', False),
                        "matches": len(result.get('matches', [])),
                        "query_vector_length": result.get('queryVectorLength', 0)
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get('error', f'HTTP {response.status}'),
                        "details": result.get('details', '')
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def process_subscriber(self, session: aiohttp.ClientSession, subscriber: Dict, skip_existing: bool = False) -> Dict:
        """Process a single subscriber"""
        subscriber_id = subscriber.get('id')
        github_data = subscriber.get('github_url_data')
        first_name = subscriber.get('first_name', '')
        last_name = subscriber.get('last_name', '')
        
        if not github_data:
            return {
                "subscriber_id": subscriber_id,
                "status": "skipped",
                "reason": "No GitHub analysis data found"
            }
        
        # Skip if already has embeddings and skip_existing is True
        if skip_existing and subscriber.get('github_vector_embeddings'):
            self.skipped_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "skipped", 
                "reason": "Already has GitHub embeddings"
            }
        
        # Extract username from github_data for logging
        username = github_data.get('username', 'Unknown')
        name_info = f"{first_name} {last_name}".strip() if first_name or last_name else "No name provided"
        print(f"🔍 Processing {username} (ID: {subscriber_id}, Name: {name_info})")
        
        # Generate embedding using existing github_data
        result = await self.generate_embedding(session, subscriber_id, github_data)
        
        if result.get("success"):
            self.processed_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "success",
                "username": username,
                "embedding_generated": result.get("embedding_generated", False),
                "matches_found": result.get("matches", 0),
                "vector_length": result.get("query_vector_length", 0),
                "dry_run": result.get("dry_run", False)
            }
        else:
            self.error_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "error",
                "username": username,
                "error": result.get("error"),
                "details": result.get("details", "")
            }

    async def process_batch(self, limit: Optional[int] = None, skip_existing: bool = False, max_concurrent: int = 5):
        """Process all subscribers in batches"""
        print(f"🚀 Starting batch GitHub embeddings generation...")
        print(f"📊 Settings: limit={limit}, skip_existing={skip_existing}, max_concurrent={max_concurrent}")
        print(f"🏃 Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print()
        
        async with aiohttp.ClientSession() as session:
            # Get subscribers with GitHub data
            subscribers = await self.get_subscribers_with_github_data(session, limit, skip_existing)
            
            if not subscribers:
                print("❌ No subscribers found with GitHub data")
                return
            
            print(f"📋 Found {len(subscribers)} subscribers to process")
            print()
            # Process subscribers with concurrency control
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def process_with_semaphore(subscriber):
                async with semaphore:
                    result = await self.process_subscriber(session, subscriber, skip_existing)
                    self.results.append(result)
                    
                    # Print progress
                    status_emoji = "✅" if result["status"] == "success" else "⏭️" if result["status"] == "skipped" else "❌"
                    print(f"{status_emoji} User {result['subscriber_id']}: {result.get('username', 'N/A')} - {result['status']}")
                    
                    if result["status"] == "error":
                        print(f"   Error: {result.get('error')}")
                        if result.get('details'):
                            print(f"   Details: {result.get('details')}")
                    
                    return result
            
            # Execute all tasks
            tasks = [process_with_semaphore(subscriber) for subscriber in subscribers]
            await asyncio.gather(*tasks)
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("📊 BATCH EMBEDDINGS SUMMARY")
        print("="*60)
        print(f"✅ Successfully processed: {self.processed_count}")
        print(f"❌ Errors: {self.error_count}")
        print(f"⏭️ Skipped: {self.skipped_count}")
        print(f"📋 Total: {len(self.results)}")
        print()
        
        if self.error_count > 0:
            print("❌ ERRORS:")
            for result in self.results:
                if result["status"] == "error":
                    print(f"  - User {result['subscriber_id']} ({result.get('username', 'N/A')}): {result.get('error')}")
                    if result.get('details'):
                        print(f"    Details: {result.get('details')}")
            print()
        
        # Group by status
        success_results = [r for r in self.results if r["status"] == "success"]
        if success_results:
            embeddings_generated = sum(1 for r in success_results if r.get("embedding_generated"))
            total_matches = sum(r.get("matches_found", 0) for r in success_results)
            print(f"📈 Embedding Stats:")
            print(f"  - Embeddings generated: {embeddings_generated}/{len(success_results)}")
            print(f"  - Total similarity matches found: {total_matches}")
        
        print(f"\n🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    parser = argparse.ArgumentParser(description="Batch process GitHub embeddings for existing analysis data")
    parser.add_argument("--dry-run", action="store_true", help="Preview what would be processed without making changes")
    parser.add_argument("--limit", type=int, help="Limit number of subscribers to process")
    parser.add_argument("--skip-existing", action="store_true", help="Skip subscribers who already have GitHub embeddings")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Base URL for API calls")
    parser.add_argument("--max-concurrent", type=int, default=5, help="Maximum concurrent API calls")
    parser.add_argument("--service-key", required=True, help="Supabase service role key for authentication")
    
    args = parser.parse_args()
    
    # Create processor
    try:
        processor = BatchGitHubEmbeddingsProcessor(
            base_url=args.base_url, 
            dry_run=args.dry_run, 
            service_role_key=args.service_key
        )
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        sys.exit(1)
    
    # Run batch processing
    try:
        asyncio.run(processor.process_batch(
            limit=args.limit,
            skip_existing=args.skip_existing,
            max_concurrent=args.max_concurrent
        ))
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
        processor.print_summary()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        processor.print_summary()

if __name__ == "__main__":
    main()