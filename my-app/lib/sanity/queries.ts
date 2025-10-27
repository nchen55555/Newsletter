// Centralized Sanity queries to eliminate duplication and improve caching
export const COMPANIES_QUERY = `*[
  _type == "mediaLibrary"
]{
  _id,
  company,
  image,
  publishedAt,
  alt,
  caption,
  description,
  tags,
  hiring_tags,
  partner, 
  pending_partner,
  external_media,
  people
}`;

// Helper function to create filtered company query
export const createFilteredCompaniesQuery = (companyIds: (string | number)[]) => `*[
  _type == "mediaLibrary" && company in [${companyIds.join(', ')}]
]{
  _id,
  company,
  image,
  publishedAt,
  alt,
  caption,
  description,
  tags,
  hiring_tags,
  location,
  partner,
  pending_partner,
  external_media,
  people
}`;

export const POSTS_QUERY = `*[_type == "post" 
  && defined(slug.current)
  && !(slug.current match "*-beta*")
]|order(publishedAt desc)`;

export const LIMITED_POSTS_QUERY = `*[_type == "post" 
  && defined(slug.current)
  && !(slug.current match "*-beta*")
]|order(publishedAt desc)[0...10]{_id, title, slug, publishedAt, image}`;

export const COMPANY_POST_QUERY = `*[_type == "post" && company == $companyId][0]`;

export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]`;

// Cache options for different data types
export const CACHE_OPTIONS = {
  // Companies change less frequently
  COMPANIES: { next: { revalidate: 600 } }, // 10 minutes
  // Posts change more frequently 
  POSTS: { next: { revalidate: 600 } }, // 10 minutes
  // Individual articles change least frequently
  ARTICLES: { next: { revalidate: 900 } }, // 15 minutes
};