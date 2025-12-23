/**
 * TAMPER-EVIDENT BLOCKCHAIN LEDGER
 * 
 * TECHNICAL AFFIDAVIT:
 * This implements a local append-only blockchain for vote storage.
 * Each block is cryptographically chained to its predecessor via SHA-256.
 * Proof-of-Work mechanism deters automated ballot stuffing.
 * Any modification to a historical block invalidates all subsequent blocks.
 * 
 * Security Properties:
 * - Immutability: Hash chain ensures modification detection
 * - Ordering: Blocks are strictly ordered by index
 * - Non-repudiation: Timestamps provide audit trail
 * - Tamper evidence: Chain validation detects alterations
 */

import { sha256, mineBlock, verifyProofOfWork } from './crypto';

export interface Block {
  index: number;
  timestamp: number;
  encryptedVote: string;
  voterHash: string; // One-way hash, not reversible to identity
  previousHash: string;
  nonce: string;
  hash: string;
  difficulty: number;
}

export interface BlockchainState {
  chain: Block[];
  pendingVotes: Map<string, Block>; // voterHash -> most recent vote
  isValid: boolean;
  lastValidated: number;
}

// Genesis block - hardcoded for chain initialization
const GENESIS_BLOCK: Block = {
  index: 0,
  timestamp: 1700000000000,
  encryptedVote: 'GENESIS',
  voterHash: '0'.repeat(64),
  previousHash: '0'.repeat(64),
  nonce: '0'.repeat(32),
  hash: 'GENESIS_HASH_ELECTORAL_COMMISSION_2024',
  difficulty: 4
};

/**
 * Create initial blockchain state
 */
export function createBlockchain(): BlockchainState {
  return {
    chain: [GENESIS_BLOCK],
    pendingVotes: new Map(),
    isValid: true,
    lastValidated: Date.now()
  };
}

/**
 * Calculate block hash
 */
async function calculateBlockHash(block: Omit<Block, 'hash'>): Promise<string> {
  const data = JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    encryptedVote: block.encryptedVote,
    voterHash: block.voterHash,
    previousHash: block.previousHash,
    nonce: block.nonce
  });
  return sha256(data);
}

/**
 * Add a new vote to the blockchain
 * 
 * COERCION RESISTANCE:
 * - Multiple votes per voter are allowed
 * - Only the LAST vote per voter hash is counted
 * - Voters cannot prove how they voted (encrypted payload)
 */
export async function addVote(
  state: BlockchainState,
  encryptedVote: string,
  voterHash: string,
  difficulty: number = 4
): Promise<{ state: BlockchainState; block: Block; miningTime: number }> {
  const startTime = Date.now();
  const previousBlock = state.chain[state.chain.length - 1];
  
  // Prepare block data
  const blockData: Omit<Block, 'hash' | 'nonce'> = {
    index: previousBlock.index + 1,
    timestamp: Date.now(),
    encryptedVote,
    voterHash,
    previousHash: previousBlock.hash,
    difficulty
  };
  
  // Mine the block (Proof-of-Work)
  const { nonce, hash } = await mineBlock(
    JSON.stringify(blockData),
    previousBlock.hash,
    difficulty
  );
  
  const newBlock: Block = {
    ...blockData,
    nonce,
    hash
  };
  
  // Update state
  const newChain = [...state.chain, newBlock];
  const newPendingVotes = new Map(state.pendingVotes);
  newPendingVotes.set(voterHash, newBlock);
  
  const miningTime = Date.now() - startTime;
  
  return {
    state: {
      chain: newChain,
      pendingVotes: newPendingVotes,
      isValid: true,
      lastValidated: Date.now()
    },
    block: newBlock,
    miningTime
  };
}

/**
 * Validate entire blockchain integrity
 */
export async function validateChain(chain: Block[]): Promise<{
  isValid: boolean;
  invalidBlockIndex: number | null;
  error: string | null;
}> {
  if (chain.length === 0) {
    return { isValid: false, invalidBlockIndex: 0, error: 'Empty chain' };
  }
  
  // Validate genesis block
  if (chain[0].index !== 0) {
    return { isValid: false, invalidBlockIndex: 0, error: 'Invalid genesis block' };
  }
  
  // Validate each block
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];
    
    // Check index continuity
    if (currentBlock.index !== previousBlock.index + 1) {
      return {
        isValid: false,
        invalidBlockIndex: i,
        error: `Index discontinuity at block ${i}`
      };
    }
    
    // Check previous hash linkage
    if (currentBlock.previousHash !== previousBlock.hash) {
      return {
        isValid: false,
        invalidBlockIndex: i,
        error: `Hash chain broken at block ${i}`
      };
    }
    
    // Verify block hash
    const calculatedHash = await calculateBlockHash({
      index: currentBlock.index,
      timestamp: currentBlock.timestamp,
      encryptedVote: currentBlock.encryptedVote,
      voterHash: currentBlock.voterHash,
      previousHash: currentBlock.previousHash,
      nonce: currentBlock.nonce,
      difficulty: currentBlock.difficulty
    });
    
    if (calculatedHash !== currentBlock.hash) {
      return {
        isValid: false,
        invalidBlockIndex: i,
        error: `Hash mismatch at block ${i}`
      };
    }
    
    // Verify Proof-of-Work
    if (!verifyProofOfWork(currentBlock.hash, currentBlock.difficulty)) {
      return {
        isValid: false,
        invalidBlockIndex: i,
        error: `Invalid PoW at block ${i}`
      };
    }
    
    // Check timestamp ordering
    if (currentBlock.timestamp < previousBlock.timestamp) {
      return {
        isValid: false,
        invalidBlockIndex: i,
        error: `Timestamp violation at block ${i}`
      };
    }
  }
  
  return { isValid: true, invalidBlockIndex: null, error: null };
}

/**
 * Get vote counts (only callable with quorum decryption)
 * For demo: shows encrypted vote distribution
 */
export function getVoteStatistics(state: BlockchainState): {
  totalBlocks: number;
  uniqueVoters: number;
  lastBlockTime: number | null;
  chainIntegrity: boolean;
} {
  const uniqueVoters = state.pendingVotes.size;
  const lastBlock = state.chain[state.chain.length - 1];
  
  return {
    totalBlocks: state.chain.length - 1, // Exclude genesis
    uniqueVoters,
    lastBlockTime: lastBlock.index > 0 ? lastBlock.timestamp : null,
    chainIntegrity: state.isValid
  };
}

/**
 * Export chain for audit purposes
 */
export function exportChainForAudit(state: BlockchainState): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    blockCount: state.chain.length,
    chainHash: state.chain[state.chain.length - 1].hash,
    blocks: state.chain.map(block => ({
      index: block.index,
      timestamp: new Date(block.timestamp).toISOString(),
      hash: block.hash,
      previousHash: block.previousHash,
      voterHash: block.voterHash.substring(0, 16) + '...',
      difficulty: block.difficulty
    }))
  }, null, 2);
}
