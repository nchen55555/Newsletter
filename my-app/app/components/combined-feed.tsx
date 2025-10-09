'use client'

import React, { useState, useEffect } from 'react';
import { FeedRow } from "./article_mosaic";
import { FeedThread } from "./feed-thread";
import { type SanityDocument } from "next-sanity";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export interface Post extends SanityDocument {
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: SanityImageSource;
  excerpt?: string;
  author?: string;
  tags?: string[];
}

export interface FeedItem {
  id: string;
  created_at: string;
  subscriber_id: number;
  company_id?: number;
  feed_id?: string;
  content: string;
  audience_rating: number;
  author_name?: string;
  author_image?: string;
  company_name?: string;
  company_image?: string;
  referenced_feed_content?: string;
  referenced_feed_author?: string;
  company_data?: {
    _id: string;
    _rev: string;
    _type: string;
    _createdAt: string;
    _updatedAt: string;
    publishedAt: string;
    partner: boolean;
    company: number;
    alt: string;
    caption?: string;
    description?: string;
    imageUrl: string;
    location?: string;
    hiring_tags?: string[];
  };
}

export interface CombinedFeedItem {
  type: 'post' | 'thread';
  date: string;
  data: Post | FeedItem;
}

interface CombinedFeedProps {
  posts: Post[];
}

export function CombinedFeed({ posts }: CombinedFeedProps) {
  const [combinedFeed, setCombinedFeed] = useState<CombinedFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedItems = async () => {
      try {
        setLoading(true);
        
        // Fetch feed items from our API
        const response = await fetch('/api/get_feed', {
          credentials: 'include'
        });
        
        let feedItems: FeedItem[] = [];
        if (response.ok) {
          feedItems = await response.json();
        } else {
          console.error('Failed to fetch feed items - Status:', response.status, 'Status Text:', response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }

        // Combine posts and feed items, then sort by date
        const combined: CombinedFeedItem[] = [
          ...posts.map((post): CombinedFeedItem => ({
            type: 'post',
            date: post.publishedAt,
            data: post
          })),
          ...feedItems.map((feedItem): CombinedFeedItem => ({
            type: 'thread', 
            date: feedItem.created_at,
            data: feedItem
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setCombinedFeed(combined);
      } catch (err) {
        console.error('Error fetching feed items:', err);
        setError('Failed to load feed items');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedItems();
  }, [posts]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 sm:gap-7 w-full">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Feed: one item per row - Full width */}
      <div className="flex flex-col gap-6 sm:gap-7 w-full">
        {combinedFeed.map((item, index) => {
          if (item.type === 'post') {
            const post = item.data as Post;
            return <FeedRow key={post._id} post={post} index={index} />;
          } else {
            const feedItem = item.data as FeedItem;
            return <FeedThread key={feedItem.id} feedItem={feedItem} />;
          }
        })}
      </div>

      {/* Empty state */}
      {combinedFeed.length === 0 && !loading && (
        <div className="mx-auto my-24 max-w-xl rounded-3xl border border-dashed p-10 text-center text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
          <p className="text-lg">No posts or threads yet. Check back soon for fresh content.</p>
        </div>
      )}
    </>
  );
}