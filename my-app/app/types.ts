export type ProfileData = {
    id: number,
    email: string;
    first_name: string;
    last_name: string;
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
    verified?: boolean;
    application_tracker_confirmed?: boolean,
  };

export type ProfileFormState = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
  status?: string;
  transcript_url?: string;
  transcript_file?: File | null;
  applied?: boolean;
  parsed_resume_json?: string;
};

// Company-related types
import { SanityDocument } from "next-sanity"
import { SanityImageSource } from "@sanity/image-url/lib/types/types"

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
}

export type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};

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
}

export interface Step3UpdateData {
  interests?: string;
  opportunities_looking_for?: string;
  network_recommendations?: NetworkRecommendation[];
}


