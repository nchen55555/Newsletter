export type ConnectionData = {
  connect_id: number;
  rating: number;
  note?: string;
};

// Backend Profile Data
export type ProfileData = {
    id: number,
    email: string;
    first_name: string;
    last_name: string;
    school: string;
    linkedin_url: string;
    resume_url: string;
    personal_website: string;
    phone_number: string;
    access_token: string;
    profile_image_url: string;
    bio: string;
    is_public_profile?: boolean;
    newsletter_opt_in?: boolean;
    status?: string;
    transcript_url?: string;
    applied?: boolean;
    parsed_resume_json?: string;
    interests?: string;
    generated_interest_profile?: string;
    opportunities_looking_for?: string;
    connections?: number[];
    pending_connections?: number[];
    requested_connections?: number[];
    connections_new?: ConnectionData[];
    pending_connections_new?: ConnectionData[];
    requested_connections_new?: ConnectionData[];
    verified?: boolean;
    application_tracker_confirmed?: boolean,
    bookmarked_companies?: number[];
    needs_visa_sponsorship?: boolean;
    company_recommendations?: number[];
    network_recommendations?: NetworkRecommendation[];
    outreach_frequency?: number;
    onboarding_step?: number;
    connectionRating?: number;    
    parsed_transcript_json?: string;
    github_url_data?: string; 
    github_vector_embeddings?: number[];
    check_in_status?: string;
    interview_status_updated_at?: string;
    timeline_of_search?: string;  
    github_url?: string;
  };

// UI Form State for Profile
export type ProfileFormState = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  school: string;
  linkedin_url: string;
  resume_url: string;
  personal_website: string;
  phone_number: string;
  resume_file?: File | null;
  profile_image?: File | null;
  profile_image_url?: string | null;
  bio: string;
  is_public_profile: boolean;
  newsletter_opt_in: boolean;
  needs_visa_sponsorship: boolean;
  status?: string;
  transcript_url?: string;
  transcript_file?: File | null;
  applied?: boolean;
  parsed_resume_json?: string;
  bookmarked_companies?: number[];
  pending_connections_new?: ConnectionData[];
  interests?: string;
  network_recommendations?: NetworkRecommendation[];
  verified?: boolean;
  outreach_frequency?: number;
  onboarding_step?: number;
  github_url?: string;
};

// Company-related types
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"
import type { Session } from '@supabase/supabase-js'
import type { PortableTextBlock } from '@portabletext/types'

export interface CompanyData extends SanityDocument {
  company: number;
  image?: SanityImageSource;
  publishedAt: string;
  alt?: string;
  caption?: string;
  description?: string;
  tags?: string[];
  hiring_tags?: string[];
  location?: string;
  employees?: string;
  founded?: string;
  stage?: string;
  industry?: string;
  partner?: boolean;
  potential_partner?: boolean;
  external_media?: string;
  people?: string;
}

export type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

// Media Library types for company carousel
export interface MediaLibraryItem extends SanityDocument {
  image?: SanityImageSource;
  company: number;
  publishedAt: string;
  alt?: string;
  caption?: string;
  description?: string;
  tags?: string[];
  pending_partner?: boolean;
  partner?: boolean;
  hiring_tags?: string[];
  external_media?: string;
  location?: string;
  people?: string;
  body?: PortableTextBlock[];
}

// lib/resume-types.ts
export type ExperienceJob = {
  company: string;
  role: string;
  dates: string;
  summary?: string;
  summary_bullets?: string[];
  [key: string]: string | string[] | undefined; // e.g. impact_bullets, tech_bullets
};

export type ParsedResumeData = {
  experience: ExperienceJob[];
  education: string[];
  _meta?: { charCount: number; preview: string };
};

export interface ParsedEmailData {
  event_type: 'scheduled' | 'completed' | 'feedback' | 'progression' | 'offer' | 'rejection' | 'unknown'
  company_name: string
  interview_stage: 'phone_screen' | 'technical' | 'behavioral' | 'onsite' | 'final' | 'unknown'
  interview_date: string | null // ISO date string or null
  key_details: string
  confidence_score: number // 0-1
  action_required: boolean
  next_steps: string | null
  parsed_at?: string // ISO date string, added by our system
}

export interface EmailEvent {
  id: string
  application_id: string | null
  subscriber_id: string
  event_type: ParsedEmailData['event_type']
  stage: ParsedEmailData['interview_stage']
  interview_date: string | null
  details: string
  next_steps: string | null
  confidence: number
  action_required: boolean
  parsed_data: ParsedEmailData
  raw_email: string
  parsed_at: string
  created_at: string
}

export interface Company {
  id: string
  company_name: string
}

export interface Application {
  id: string
  subscriber_id: string
  company_id: string
  stage: string
  action_required: 'Yes' | 'No' | 'TBD'
  action_required_description: string
  date_added: string
  last_email_update?: string | null
  email_confidence?: number | null
  email_tracking_id?: string | null
}

export interface Subscriber {
  id: string
  email: string
}

export interface NetworkRecommendation {
  name: string;
  email: string;
  connection: string;
}

export interface Step3UpdateData {
  interests?: string;
  opportunities_looking_for?: string;
  network_recommendations?: NetworkRecommendation[];
  applied?: boolean;
  verified?: boolean;
}

// Google Calendar API types
export interface CalendarAttendee {
  email?: string;
  [key: string]: unknown;
}

export interface CalendarEvent {
  id?: string;
  htmlLink?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: CalendarAttendee[];
  organizer?: { email?: string; [key: string]: unknown };
  location?: string;
  hangoutLink?: string;
}

export interface CalendarEventMatch {
  id?: string;
  htmlLink?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: CalendarAttendee[];
  organizer?: { email?: string; [key: string]: unknown };
  location?: string;
  hangoutLink?: string;
}

// Extended Supabase session type that includes OAuth provider tokens
export interface ExtendedSession extends Session {
  provider_token?: string;
  provider_refresh_token?: string;
}

// Feed/Thread types
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

// Referral types
export interface Referral {
  id: number;
  referral_name: string;
  referral_email: string;
  referrer: number;
}

export interface ReferralWithProfile extends Referral {
  subscriber_profile?: ProfileData;
}


