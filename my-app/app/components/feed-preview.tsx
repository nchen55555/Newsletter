'use client'

import React, { useState, useEffect } from 'react';
import ProfileAvatar from './profile_avatar';

interface FeedData {
  id: string;
  content: string;
  author_name: string;
  author_image?: string;
  created_at: string;
}

export function FeedPreview({ feedId }: { feedId: string }) {
  const [feedData, setFeedData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        const response = await fetch(`/api/get_feed_item/${feedId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setFeedData(data);
        }
      } catch (error) {
        console.error('Error fetching feed data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [feedId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!feedData) {
    return (
      <div className="text-sm text-neutral-500">
        Thread not found
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
      <div className="flex items-center gap-2 mb-2">
        <ProfileAvatar
          name={feedData.author_name}
          imageUrl={feedData.author_image}
          size={32}
          editable={false}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {feedData.author_name}
          </div>
          <div className="text-xs text-neutral-500">
            {new Date(feedData.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>
      <div 
        className="text-sm text-neutral-700 line-clamp-2"
        dangerouslySetInnerHTML={{ __html: feedData.content }}
      />
    </div>
  );
}