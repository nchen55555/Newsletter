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
};