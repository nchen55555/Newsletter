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
 * Generate external profile URL with encoded ID
 * @param id Database ID of the user
 * @returns External profile URL with hashed ID
 */
export function getExternalProfileUrl(id: number): string {
  return `/external_profile/${encodeSimple(id)}`;
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
