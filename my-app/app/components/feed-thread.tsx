'use client'

import React from "react";
import { Repeat2 } from "lucide-react";
import ProfileAvatar from "./profile_avatar";
import { CompanyRow } from "../companies/company-row";
import PostComponent from "@/app/components/post";

export interface FeedItem {
  id: string;
  created_at: string;
  subscriber_id: number;
  company_id?: number;
  feed_id?: string;
  content: string; // HTML content
  audience_rating: number;
  // Additional fields for display
  author_name?: string;
  author_image?: string;
  company_name?: string;
  company_image?: string;
  // Repost data
  referenced_feed_content?: string;
  referenced_feed_author?: string;
  // Complete company data for CompanyRow
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

export function FeedThread({ feedItem}: { feedItem: FeedItem}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      <div className="p-6 sm:p-8">
        {/* Thread header with user info */}
        <div className="flex items-start gap-4 mb-6">
          <ProfileAvatar
            name={feedItem.author_name || 'User'}
            imageUrl={feedItem.author_image}
            size={64}
            editable={false}
            className="w-16 h-16 rounded-full"
          />
          <div className="flex-1">
            <div className="text-xl font-semibold text-neutral-900">
              {feedItem.author_name || 'Anonymous User'}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(feedItem.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Thread content */}
        <div 
          className="prose prose-base max-w-none text-neutral-900 mb-6 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: feedItem.content }}
        />

        {/* Repost reference - Company or Feed */}
        {(feedItem.company_data || feedItem.referenced_feed_content) && (
          <div className="flex items-center gap-3 pt-2 border-t border-input mb-4">
            <Repeat2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              {feedItem.company_data ? (
                <CompanyRow company={feedItem.company_data} />
              ) : feedItem.referenced_feed_content && (
                <div>
                  <div className="text-xs text-neutral-500 mb-1">
                    Reposting thread by {feedItem.referenced_feed_author}
                  </div>
                  <div 
                    className="text-sm text-neutral-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: feedItem.referenced_feed_content }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thread actions */}
        <div className="flex items-center gap-2">
          {/* <Share company={feedItem.company_id || index} /> */}
          <div onClick={(e) => e.stopPropagation()}>
            <PostComponent 
              feedId={feedItem.id}
            />
          </div>
        </div>
      </div>
    </article>
  );
}