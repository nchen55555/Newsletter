// Simple, lightweight hash algorithm for converting IDs
// Easy to calculate manually if you know the algorithm

const OFFSET = 1000; // Simple offset to obfuscate the real ID
const MULTIPLIER = 7;  // Simple multiplier

/**
 * Encode a database ID into a simple hash
 * Algorithm: (id * 7) + 1000
 * Example: ID 123 → (123 * 7) + 1000 = 1861
 */
export function encodeSimple(id: number): string {
  if (!id || id <= 0) {
    throw new Error('Invalid ID provided');
  }
  
  const encoded = (id * MULTIPLIER) + OFFSET;
  return encoded.toString();
}

/**
 * Decode a simple hash back to the original ID
 * Algorithm: (hash - 1000) / 7
 * Example: Hash 1861 → (1861 - 1000) / 7 = 123
 */
export function decodeSimple(hash: string): number | null {
  try {
    const num = parseInt(hash);
    if (isNaN(num) || num < OFFSET) {
      return null;
    }
    
    const decoded = (num - OFFSET) / MULTIPLIER;
    
    // Check if it's a valid integer (no remainder)
    if (decoded !== Math.floor(decoded)) {
      return null;
    }
    
    return decoded > 0 ? decoded : null;
  } catch (error) {
    console.log(error)
    return null;
  }
}

/**
 * Manual calculation reference:
 * 
 * TO ENCODE (ID → Hash):
 * 1. Take your database ID (e.g., 123)
 * 2. Multiply by 7: 123 × 7 = 861
 * 3. Add 1000: 861 + 1000 = 1861
 * 4. Result: 1861
 * 
 * TO DECODE (Hash → ID):
 * 1. Take your hash (e.g., 1861)
 * 2. Subtract 1000: 1861 - 1000 = 861
 * 3. Divide by 7: 861 ÷ 7 = 123
 * 4. Result: 123
 * 
 * Quick reference table:
 * ID 1   → Hash 1007
 * ID 10  → Hash 1070
 * ID 50  → Hash 1350
 * ID 100 → Hash 1700
 * ID 123 → Hash 1861
 * ID 200 → Hash 2400
 */

/**
 * Encode user ID and client ID into a composite hash
 * Algorithm: Combine user ID and client ID with a separator, then apply base64 encoding
 * Example: User 123, Client 456 → "MTIzLTQ1Ng=="
 */
export function encodeClientSpecific(userId: number, clientId: number): string {
  if (!userId || userId <= 0 || !clientId || clientId <= 0) {
    throw new Error('Invalid user ID or client ID provided');
  }
  
  // Create a string combining both IDs with a separator
  const combined = `${userId}-${clientId}`;
  
  // Base64 encode - works in both browser and Node.js
  let encoded: string;
  if (typeof window !== 'undefined') {
    // Browser environment
    encoded = btoa(combined);
  } else {
    // Node.js environment
    encoded = Buffer.from(combined).toString('base64');
  }
  
  return encoded;
}

/**
 * Decode a client-specific hash back to user ID and client ID
 * Returns null if decoding fails or format is invalid
 */
export function decodeClientSpecific(hash: string): { userId: number; clientId: number } | null {
  try {
    // Base64 decode - works in both browser and Node.js
    let decoded: string;
    if (typeof window !== 'undefined') {
      // Browser environment
      decoded = atob(hash);
    } else {
      // Node.js environment
      decoded = Buffer.from(hash, 'base64').toString();
    }
    
    // Split by separator
    const parts = decoded.split('-');
    if (parts.length !== 2) {
      return null;
    }
    
    const userId = parseInt(parts[0]);
    const clientId = parseInt(parts[1]);
    
    if (isNaN(userId) || isNaN(clientId) || userId <= 0 || clientId <= 0) {
      return null;
    }
    
    return { userId, clientId };
  } catch (error) {
    console.log('Error decoding client-specific hash:', error);
    return null;
  }
}

/**
 * Generate external profile URL with encoded ID
 * @param id Database ID of the user
 * @returns External profile URL with hashed ID
 */
export function getExternalProfileUrl(id: number): string {
  return `/external_profile/${encodeSimple(id)}`;
}

/**
 * Generate client-specific external profile URL
 * @param userId Database ID of the user
 * @param clientId Database ID of the client
 * @returns External profile URL with encoded user and client IDs
 */
export function getClientSpecificProfileUrl(userId: number, clientId: number): string {
  return `/external_profile/${encodeClientSpecific(userId, clientId)}`;
}

/**
 * Encode candidate ID and client ID using simple encoding with underscore separator
 * Format: candidateId_clientId (both encoded using encodeSimple)
 * Example: User 123, Client 2 → "1861_1014"
 */
export function encodeWithClient(candidateId: number, clientId: number): string {
  const encodedCandidateId = encodeSimple(candidateId);
  const encodedClientId = encodeSimple(clientId);
  return `${encodedCandidateId}_${encodedClientId}`;
}

/**
 * Decode candidate ID and client ID from underscore-separated format
 * Returns null if decoding fails or format is invalid
 */
export function decodeWithClient(hash: string): { candidateId: number; clientId: number } | null {
  try {
    const parts = hash.split('_');
    if (parts.length !== 2) {
      return null;
    }
    
    const candidateId = decodeSimple(parts[0]);
    const clientId = decodeSimple(parts[1]);
    
    if (candidateId === null || clientId === null) {
      return null;
    }
    
    return { candidateId, clientId };
  } catch (error) {
    console.log('Error decoding candidate_client hash:', error);
    return null;
  }
}

/**
 * Generate external profile URL with candidate and client IDs
 * @param candidateId Database ID of the candidate
 * @param clientId Database ID of the client
 * @returns External profile URL with encoded candidate and client IDs
 */
export function getExternalProfileUrlWithClient(candidateId: number, clientId: number): string {
  return `/external_profile/${encodeWithClient(candidateId, clientId)}`;
}

/**
 * Test the simple hash functions
 */
export function testSimpleHash() {  
  const testIds = [1, 10, 50, 100, 123, 200];
  
  testIds.forEach(id => {
    const encoded = encodeSimple(id);
    decodeSimple(encoded);
  });
  
  return testIds.map(id => ({
    id,
    hash: encodeSimple(id),
    decoded: decodeSimple(encodeSimple(id))
  }));
}
