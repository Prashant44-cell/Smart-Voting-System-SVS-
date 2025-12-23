/**
 * ENCRYPTED VOTER DATABASE (SIMULATED)
 * 
 * TECHNICAL AFFIDAVIT:
 * In production, this would be a SQLite database encrypted with AES-256-GCM.
 * The encryption key would be sealed by TPM, bound to device identity.
 * This simulation uses in-memory storage with hashed credentials.
 * 
 * Security Properties:
 * - Credentials stored as SHA-256 hashes (one-way)
 * - No plaintext PINs or IDs stored
 * - Constituency mapping is read-only at runtime
 * - Failed attempt tracking prevents brute force
 */

import { sha256 } from './crypto';

export interface VoterRecord {
  nationalIdHash: string;
  pinHash: string;
  constituency: string;
  hasVoted: boolean;
  failedAttempts: number;
  lockedUntil: number | null;
}

export interface Constituency {
  id: string;
  name: string;
  region: string;
  candidates: Candidate[];
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  partyAbbrev: string;
  ballotPosition: number;
}

// Pre-computed hashes for demo voters
// In production: these would be loaded from encrypted SQLite
const MOCK_VOTERS: VoterRecord[] = [];
const CONSTITUENCIES: Map<string, Constituency> = new Map();

// Initialize mock data
async function initializeMockData() {
  // Demo voters with pre-computed hashes
  const voterData = [
    { id: 'A123456789', pin: '1234', constituency: 'central-metro' },
    { id: 'B987654321', pin: '5678', constituency: 'northern-rural' },
    { id: 'C456789123', pin: '9012', constituency: 'coastal-east' },
    { id: 'D789123456', pin: '3456', constituency: 'western-highlands' },
    { id: 'E321654987', pin: '7890', constituency: 'southern-plains' },
  ];
  
  for (const voter of voterData) {
    MOCK_VOTERS.push({
      nationalIdHash: await sha256(voter.id),
      pinHash: await sha256(voter.pin),
      constituency: voter.constituency,
      hasVoted: false,
      failedAttempts: 0,
      lockedUntil: null
    });
  }
  
  // Initialize constituencies with candidates
  CONSTITUENCIES.set('central-metro', {
    id: 'central-metro',
    name: 'Central Metropolitan',
    region: 'Capital Region',
    candidates: [
      { id: 'cm1', name: 'Alexandra Chen', party: 'Progressive Alliance', partyAbbrev: 'PA', ballotPosition: 1 },
      { id: 'cm2', name: 'Marcus Williams', party: 'Unity Coalition', partyAbbrev: 'UC', ballotPosition: 2 },
      { id: 'cm3', name: 'Sarah Okonkwo', party: 'Civic Reform Party', partyAbbrev: 'CRP', ballotPosition: 3 },
      { id: 'cm4', name: 'James Rodriguez', party: 'Independent', partyAbbrev: 'IND', ballotPosition: 4 },
    ]
  });
  
  CONSTITUENCIES.set('northern-rural', {
    id: 'northern-rural',
    name: 'Northern Rural District',
    region: 'Northern Province',
    candidates: [
      { id: 'nr1', name: 'Margaret Thompson', party: 'Rural First Party', partyAbbrev: 'RFP', ballotPosition: 1 },
      { id: 'nr2', name: 'David Nakamura', party: 'Progressive Alliance', partyAbbrev: 'PA', ballotPosition: 2 },
      { id: 'nr3', name: 'Elena Petrov', party: 'Unity Coalition', partyAbbrev: 'UC', ballotPosition: 3 },
    ]
  });
  
  CONSTITUENCIES.set('coastal-east', {
    id: 'coastal-east',
    name: 'Eastern Coastal Region',
    region: 'Eastern Seaboard',
    candidates: [
      { id: 'ce1', name: 'Michael Oduya', party: 'Maritime Alliance', partyAbbrev: 'MA', ballotPosition: 1 },
      { id: 'ce2', name: 'Jennifer Walsh', party: 'Progressive Alliance', partyAbbrev: 'PA', ballotPosition: 2 },
      { id: 'ce3', name: 'Roberto Silva', party: 'Civic Reform Party', partyAbbrev: 'CRP', ballotPosition: 3 },
      { id: 'ce4', name: 'Hannah Kim', party: 'Unity Coalition', partyAbbrev: 'UC', ballotPosition: 4 },
      { id: 'ce5', name: 'Thomas Anderson', party: 'Independent', partyAbbrev: 'IND', ballotPosition: 5 },
    ]
  });
  
  CONSTITUENCIES.set('western-highlands', {
    id: 'western-highlands',
    name: 'Western Highlands',
    region: 'Mountain Region',
    candidates: [
      { id: 'wh1', name: 'Patricia Morales', party: 'Highland Heritage Party', partyAbbrev: 'HHP', ballotPosition: 1 },
      { id: 'wh2', name: 'Andrew Campbell', party: 'Progressive Alliance', partyAbbrev: 'PA', ballotPosition: 2 },
      { id: 'wh3', name: 'Lisa Yamamoto', party: 'Unity Coalition', partyAbbrev: 'UC', ballotPosition: 3 },
    ]
  });
  
  CONSTITUENCIES.set('southern-plains', {
    id: 'southern-plains',
    name: 'Southern Plains District',
    region: 'Southern Lowlands',
    candidates: [
      { id: 'sp1', name: 'Richard Mensah', party: 'Agricultural Workers Union', partyAbbrev: 'AWU', ballotPosition: 1 },
      { id: 'sp2', name: 'Catherine Brooks', party: 'Progressive Alliance', partyAbbrev: 'PA', ballotPosition: 2 },
      { id: 'sp3', name: 'Steven Lee', party: 'Civic Reform Party', partyAbbrev: 'CRP', ballotPosition: 3 },
      { id: 'sp4', name: 'Amanda Foster', party: 'Unity Coalition', partyAbbrev: 'UC', ballotPosition: 4 },
    ]
  });
}

// Initialization flag
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initializeMockData();
    isInitialized = true;
  }
}

/**
 * Authenticate voter with National ID and PIN
 * Returns voter record if successful, null otherwise
 * 
 * Security: 3 failed attempts locks account for 5 minutes
 */
export async function authenticateVoter(
  nationalId: string,
  pin: string
): Promise<{ success: boolean; voter?: VoterRecord; error?: string; attemptsRemaining?: number }> {
  await ensureInitialized();
  
  const idHash = await sha256(nationalId);
  const pinHash = await sha256(pin);
  
  const voter = MOCK_VOTERS.find(v => v.nationalIdHash === idHash);
  
  if (!voter) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Check if account is locked
  if (voter.lockedUntil && Date.now() < voter.lockedUntil) {
    const remainingSeconds = Math.ceil((voter.lockedUntil - Date.now()) / 1000);
    return { 
      success: false, 
      error: `Account locked. Try again in ${remainingSeconds} seconds.` 
    };
  }
  
  // Reset lock if expired
  if (voter.lockedUntil && Date.now() >= voter.lockedUntil) {
    voter.lockedUntil = null;
    voter.failedAttempts = 0;
  }
  
  // Verify PIN
  if (voter.pinHash !== pinHash) {
    voter.failedAttempts++;
    
    if (voter.failedAttempts >= 3) {
      voter.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
      return { 
        success: false, 
        error: 'Account locked due to too many failed attempts. Try again in 5 minutes.',
        attemptsRemaining: 0
      };
    }
    
    return { 
      success: false, 
      error: 'Invalid credentials',
      attemptsRemaining: 3 - voter.failedAttempts
    };
  }
  
  // Success - reset failed attempts
  voter.failedAttempts = 0;
  
  return { success: true, voter };
}

/**
 * Get constituency information for authenticated voter
 */
export async function getConstituency(constituencyId: string): Promise<Constituency | null> {
  await ensureInitialized();
  return CONSTITUENCIES.get(constituencyId) || null;
}

/**
 * Get voter's unique hash for blockchain recording
 */
export async function getVoterHash(nationalId: string): Promise<string> {
  // Double-hash for additional privacy layer
  const firstHash = await sha256(nationalId);
  return sha256(firstHash + 'ELECTORAL_SALT_2024');
}

/**
 * Mark voter as having voted (for audit purposes only)
 * Note: Voter can still vote again - only last vote counts
 */
export async function markVoterVoted(nationalIdHash: string): Promise<void> {
  await ensureInitialized();
  const voter = MOCK_VOTERS.find(v => v.nationalIdHash === nationalIdHash);
  if (voter) {
    voter.hasVoted = true;
  }
}

/**
 * Get demo credentials for testing
 */
export function getDemoCredentials(): { nationalId: string; pin: string }[] {
  return [
    { nationalId: 'A123456789', pin: '1234' },
    { nationalId: 'B987654321', pin: '5678' },
    { nationalId: 'C456789123', pin: '9012' },
  ];
}

/**
 * Admin authentication (separate from voter auth)
 */
export async function authenticateAdmin(
  username: string,
  password: string
): Promise<boolean> {
  // Demo admin credentials
  const adminHash = await sha256('admin');
  const passHash = await sha256('electoral2024');
  
  const inputUserHash = await sha256(username);
  const inputPassHash = await sha256(password);
  
  return inputUserHash === adminHash && inputPassHash === passHash;
}
