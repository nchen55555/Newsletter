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
    evaluation_url?: string;
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
  evaluation_url?: string;
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
}

export type CompanyWithImageUrl = CompanyData & {
  imageUrl: string | null;
};