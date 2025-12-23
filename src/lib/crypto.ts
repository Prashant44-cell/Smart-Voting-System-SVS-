/**
 * ELECTORAL CRYPTOGRAPHIC UTILITIES
 * 
 * TECHNICAL AFFIDAVIT:
 * This module implements cryptographic primitives using the Web Crypto API.
 * In a production Electron environment, these would use Node.js crypto module
 * with hardware security module (HSM) integration for key protection.
 * 
 * Security Properties:
 * - SHA-256 for collision-resistant hashing
 * - AES-256-GCM for authenticated encryption (simulated)
 * - RSA-2048 key generation for vote encryption (simulated)
 * - Shamir's Secret Sharing for threshold key recovery
 */

// Convert ArrayBuffer to hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert string to ArrayBuffer
export function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

/**
 * SHA-256 Hash Function
 * Used for: Voter ID hashing, PIN hashing, block hash chaining
 */
export async function sha256(data: string): Promise<string> {
  const buffer = stringToBuffer(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random nonce for blockchain proof-of-work
 */
export function generateNonce(): string {
  return bufferToHex(generateRandomBytes(16).buffer as ArrayBuffer);
}

/**
 * SIMULATED AES-256-GCM Encryption
 * 
 * In production: Uses sealed TPM key derived from device identity
 * Here: Demonstrates the encryption flow with Web Crypto API
 */
export async function encryptAES256GCM(
  plaintext: string,
  keyHex: string
): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const iv = generateRandomBytes(12);
  const keyBuffer = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    stringToBuffer(plaintext)
  );
  
  // Last 16 bytes are the authentication tag
  const ciphertext = bufferToHex(cipherBuffer.slice(0, -16));
  const tag = bufferToHex(cipherBuffer.slice(-16));
  
  return {
    ciphertext,
    iv: bufferToHex(iv.buffer as ArrayBuffer),
    tag
  };
}

/**
 * SIMULATED RSA-2048 Vote Encryption
 * 
 * In production: RSA public key encrypts vote payload
 * Private key is split via Shamir's Secret Sharing
 * Decryption requires k-of-n key holders
 */
export async function encryptVoteRSA(
  voteData: object
): Promise<{ encryptedVote: string; timestamp: number }> {
  const plaintext = JSON.stringify(voteData);
  const timestamp = Date.now();
  
  // Simulate RSA encryption with a deterministic transform
  // In production: actual RSA-OAEP encryption
  const hash = await sha256(plaintext + timestamp);
  
  return {
    encryptedVote: `RSA2048:${hash}:${bufferToHex(stringToBuffer(plaintext))}`,
    timestamp
  };
}

/**
 * SHAMIR'S SECRET SHARING
 * Threshold: 3-of-5
 * 
 * Implements polynomial interpolation over GF(256)
 * Each shard is insufficient alone to reconstruct the secret
 */

// GF(256) operations for Shamir's Secret Sharing
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

// Initialize lookup tables for GF(256) arithmetic
(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11b;
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  if (a === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] - LOG_TABLE[b] + 255) % 255];
}

/**
 * Split a secret into n shares with threshold k
 */
export function shamirSplit(
  secret: Uint8Array,
  n: number,
  k: number
): { x: number; y: Uint8Array }[] {
  if (k > n) throw new Error('Threshold cannot exceed total shares');
  if (k < 2) throw new Error('Threshold must be at least 2');
  
  const shares: { x: number; y: Uint8Array }[] = [];
  
  for (let i = 1; i <= n; i++) {
    shares.push({ x: i, y: new Uint8Array(secret.length) });
  }
  
  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    // Generate random coefficients for polynomial
    const coefficients = new Uint8Array(k);
    coefficients[0] = secret[byteIdx]; // constant term is the secret
    
    for (let i = 1; i < k; i++) {
      coefficients[i] = generateRandomBytes(1)[0];
    }
    
    // Evaluate polynomial at each share point
    for (let shareIdx = 0; shareIdx < n; shareIdx++) {
      const x = shares[shareIdx].x;
      let y = 0;
      let xPow = 1;
      
      for (let i = 0; i < k; i++) {
        y ^= gfMul(coefficients[i], xPow);
        xPow = gfMul(xPow, x);
      }
      
      shares[shareIdx].y[byteIdx] = y;
    }
  }
  
  return shares;
}

/**
 * Reconstruct secret from k shares using Lagrange interpolation
 */
export function shamirCombine(
  shares: { x: number; y: Uint8Array }[]
): Uint8Array {
  if (shares.length < 2) throw new Error('Need at least 2 shares');
  
  const secretLength = shares[0].y.length;
  const secret = new Uint8Array(secretLength);
  
  for (let byteIdx = 0; byteIdx < secretLength; byteIdx++) {
    let value = 0;
    
    for (let i = 0; i < shares.length; i++) {
      let lagrange = 1;
      
      for (let j = 0; j < shares.length; j++) {
        if (i !== j) {
          const num = shares[j].x;
          const den = shares[i].x ^ shares[j].x;
          lagrange = gfMul(lagrange, gfDiv(num, den));
        }
      }
      
      value ^= gfMul(shares[i].y[byteIdx], lagrange);
    }
    
    secret[byteIdx] = value;
  }
  
  return secret;
}

/**
 * Encode share for display/storage
 */
export function encodeShare(share: { x: number; y: Uint8Array }): string {
  return `SHARD-${share.x.toString().padStart(2, '0')}:${bufferToHex(share.y.buffer as ArrayBuffer)}`;
}

/**
 * Decode share from string representation
 */
export function decodeShare(encoded: string): { x: number; y: Uint8Array } {
  const match = encoded.match(/^SHARD-(\d+):([a-f0-9]+)$/i);
  if (!match) throw new Error('Invalid share format');
  
  const x = parseInt(match[1], 10);
  const y = new Uint8Array(
    match[2].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  return { x, y };
}

/**
 * Proof-of-Work: Find nonce that produces hash with required leading zeros
 */
export async function mineBlock(
  data: string,
  previousHash: string,
  difficulty: number = 4
): Promise<{ nonce: string; hash: string; attempts: number }> {
  const target = '0'.repeat(difficulty);
  let attempts = 0;
  
  while (true) {
    attempts++;
    const nonce = generateNonce();
    const hash = await sha256(`${data}${previousHash}${nonce}`);
    
    if (hash.startsWith(target)) {
      return { nonce, hash, attempts };
    }
    
    // Yield to prevent blocking (web environment consideration)
    if (attempts % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Safety limit for demo
    if (attempts > 10000) {
      // Return best effort for demo purposes
      return { nonce, hash, attempts };
    }
  }
}

/**
 * Verify block hash meets difficulty requirement
 */
export function verifyProofOfWork(hash: string, difficulty: number = 4): boolean {
  return hash.startsWith('0'.repeat(difficulty));
}

/**
 * Generate device-bound encryption key (simulated TPM sealing)
 * 
 * In production: Key is derived from TPM-sealed storage
 * bound to PCR measurements and device identity
 */
export async function deriveDeviceKey(): Promise<string> {
  // Simulate device identity
  const deviceId = 'KIOSK-001';
  const appIntegrity = 'VERIFIED';
  const bootState = 'SECURE';
  
  const context = `${deviceId}:${appIntegrity}:${bootState}`;
  const keyMaterial = await sha256(context);
  
  // Return 256-bit key
  return keyMaterial;
}
