#!/usr/bin/env python3
"""
Batch GitHub Analysis Script
============================

This script processes all subscribers with GitHub URLs to:
1. Analyze their GitHub profiles 
2. Generate embeddings
3. Update their Supabase records

Usage:
    python app/scripts/batch_github_analysis.py [--dry-run] [--limit N] [--skip-existing]
"""

import asyncio
import aiohttp
import json
import argparse
import os
import sys
from datetime import datetime
from typing import List, Dict, Optional
import re

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class BatchGitHubProcessor:
    def __init__(self, base_url: str = "http://localhost:3000", dry_run: bool = False, service_role_key: str = None):
        self.base_url = base_url
        self.dry_run = dry_run
        self.service_role_key = service_role_key
        self.processed_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.results = []
        
    def extract_github_username(self, github_url: str) -> Optional[str]:
        """Extract username from GitHub URL"""
        if not github_url:
            return None
            
        # Clean up the URL and extract username
        github_url = github_url.strip()
        
        # Handle various GitHub URL formats
        patterns = [
            r'https?://github\.com/([^/\?]+)',
            r'github\.com/([^/\?]+)',
            r'^([^/\?]+)$'  # Just username
        ]
        
        for pattern in patterns:
            match = re.search(pattern, github_url, re.IGNORECASE)
            if match:
                username = match.group(1).strip()
                # Filter out common non-username paths
                if username.lower() not in ['orgs', 'organizations', 'explore', 'settings', 'notifications']:
                    return username
        
        return None

    async def get_subscribers_with_github_urls(self, session: aiohttp.ClientSession, limit: Optional[int] = None) -> List[Dict]:
        """Fetch subscribers who have GitHub URLs but might not have embeddings yet."""
        try:
            params = {}
            if limit:
                params['limit'] = limit
            
            headers = {}
            if self.service_role_key:
                headers['authorization'] = f'Bearer {self.service_role_key}'
                
            async with session.get(f"{self.base_url}/api/get_subscribers_with_github", 
                                 params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('subscribers', [])
                else:
                    print(f"❌ Failed to fetch subscribers: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error fetching subscribers: {e}")
            return []

    async def analyze_github_profile(self, session: aiohttp.ClientSession, username: str, subscriber_id: int) -> Dict:
        """Analyze a GitHub profile using the existing API"""
        try:
            payload = {
                "username": username,
                "store_to_user": True,
                "id": subscriber_id
            }
            
            if self.dry_run:
                print(f"🔍 [DRY RUN] Would analyze GitHub profile for user {subscriber_id}: {username}")
                return {"success": True, "dry_run": True, "username": username}
            
            headers = {"Content-Type": "application/json"}
            if self.service_role_key:
                headers['authorization'] = f'Bearer {self.service_role_key}'
            
            async with session.post(f"{self.base_url}/api/analyze-github-profile", 
                                  json=payload, headers=headers) as response:
                result = await response.json()
                
                if response.status == 200 and result.get('success'):
                    return {
                        "success": True,
                        "username": username,
                        "repositories_analyzed": len(result.get('data', {}).get('analyzedRepositories', [])),
                        "embedding_generated": result.get('embeddingGenerated', False)
                    }
                else:
                    return {
                        "success": False,
                        "username": username,
                        "error": result.get('error', f'HTTP {response.status}')
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "username": username,
                "error": str(e)
            }

    async def process_subscriber(self, session: aiohttp.ClientSession, subscriber: Dict, skip_existing: bool = False) -> Dict:
        """Process a single subscriber"""
        subscriber_id = subscriber.get('id')
        github_url = subscriber.get('github_url', '')  # Use github_url column
        
        # Extract username from URL
        username = self.extract_github_username(github_url)
        
        if not username:
            return {
                "subscriber_id": subscriber_id,
                "status": "skipped",
                "reason": "No valid GitHub username found",
                "github_url": github_url
            }
        
        # Skip if already has embeddings and skip_existing is True
        if skip_existing and subscriber.get('github_vector_embeddings'):
            self.skipped_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "skipped", 
                "reason": "Already has GitHub embeddings",
                "username": username
            }
        
        # Analyze GitHub profile
        result = await self.analyze_github_profile(session, username, subscriber_id)
        
        if result.get("success"):
            self.processed_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "success",
                "username": username,
                "repositories_analyzed": result.get("repositories_analyzed", 0),
                "embedding_generated": result.get("embedding_generated", False),
                "dry_run": result.get("dry_run", False)
            }
        else:
            self.error_count += 1
            return {
                "subscriber_id": subscriber_id,
                "status": "error",
                "username": username,
                "error": result.get("error")
            }

    async def process_batch(self, limit: Optional[int] = None, skip_existing: bool = False, max_concurrent: int = 5):
        """Process all subscribers in batches"""
        print(f"🚀 Starting batch GitHub analysis...")
        print(f"📊 Settings: limit={limit}, skip_existing={skip_existing}, max_concurrent={max_concurrent}")
        print(f"🏃 Mode: {'DRY RUN' if self.dry_run else 'LIVE'}")
        print()
        
        async with aiohttp.ClientSession() as session:
            # Get subscribers with GitHub URLs
            subscribers = await self.get_subscribers_with_github_urls(session, limit)
            
            if not subscribers:
                print("❌ No subscribers found with GitHub URLs")
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
                    
                    return result
            
            # Execute all tasks
            tasks = [process_with_semaphore(subscriber) for subscriber in subscribers]
            await asyncio.gather(*tasks)
            
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print processing summary"""
        print("\n" + "="*60)
        print("📊 BATCH PROCESSING SUMMARY")
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
            print()
        
        # Group by status
        success_results = [r for r in self.results if r["status"] == "success"]
        if success_results:
            total_repos = sum(r.get("repositories_analyzed", 0) for r in success_results)
            embeddings_generated = sum(1 for r in success_results if r.get("embedding_generated"))
            print(f"📈 Analysis Stats:")
            print(f"  - Total repositories analyzed: {total_repos}")
            print(f"  - Embeddings generated: {embeddings_generated}/{len(success_results)}")
        
        print(f"\n🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    parser = argparse.ArgumentParser(description="Batch process GitHub URLs for embedding generation")
    parser.add_argument("--dry-run", action="store_true", help="Preview what would be processed without making changes")
    parser.add_argument("--limit", type=int, help="Limit number of subscribers to process")
    parser.add_argument("--skip-existing", action="store_true", help="Skip subscribers who already have GitHub embeddings")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Base URL for API calls")
    parser.add_argument("--max-concurrent", type=int, default=5, help="Maximum concurrent API calls")
    parser.add_argument("--service-key", required=True, help="Supabase service role key for authentication")
    
    args = parser.parse_args()
    
    # Create processor
    processor = BatchGitHubProcessor(base_url=args.base_url, dry_run=args.dry_run, service_role_key=args.service_key)
    
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