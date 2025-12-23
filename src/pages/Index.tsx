/**
 * ELECTRONIC VOTING KIOSK - MAIN APPLICATION
 * 
 * TECHNICAL AFFIDAVIT:
 * This is a web-based prototype demonstrating the architecture and user flows
 * of a production electronic voting system. For actual deployment, this must
 * be ported to an Electron application with:
 * - Node.js main process for cryptographic operations
 * - Native SQLite with file-system encryption
 * - TPM/Secure Boot integration
 * - Air-gap enforcement via network module exclusion
 * 
 * This prototype uses Web Crypto API and in-memory storage to demonstrate
 * the security flows without hardware dependencies.
 */

import { useState, useEffect, useCallback } from 'react';
import { ElectoralHeader } from '@/components/ElectoralHeader';
import { VoterLogin } from '@/components/VoterLogin';
import { BallotScreen } from '@/components/BallotScreen';
import { VoteConfirmation } from '@/components/VoteConfirmation';
import { VoteReceipt } from '@/components/VoteReceipt';
import { AIAssistant, AIAssistantTrigger } from '@/components/AIAssistant';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminDashboard } from '@/components/AdminDashboard';
import { createBlockchain, addVote, type BlockchainState, type Block } from '@/lib/blockchain';
import { encryptVoteRSA, sha256 } from '@/lib/crypto';
import type { VoterRecord, Constituency, Candidate } from '@/lib/database';
import { Settings } from 'lucide-react';

type Screen = 
  | 'login' 
  | 'ballot' 
  | 'confirmation' 
  | 'receipt' 
  | 'admin-login' 
  | 'admin-dashboard';

interface VotingSession {
  voter: VoterRecord;
  constituency: Constituency;
  voterHash: string;
  selectedCandidate: Candidate | null;
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>('login');
  const [session, setSession] = useState<VotingSession | null>(null);
  const [blockchainState, setBlockchainState] = useState<BlockchainState>(createBlockchain);
  const [lastBlock, setLastBlock] = useState<Block | null>(null);
  const [lastMiningTime, setLastMiningTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [adminKeyPressed, setAdminKeyPressed] = useState(0);

  // Admin access via secret key combo (Ctrl+Shift+A 3 times)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setAdminKeyPressed(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setScreen('admin-login');
            return 0;
          }
          setTimeout(() => setAdminKeyPressed(0), 2000);
          return newCount;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Disable context menu in kiosk mode
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const handleAuthenticated = useCallback((
    voter: VoterRecord, 
    constituency: Constituency, 
    voterHash: string
  ) => {
    setSession({
      voter,
      constituency,
      voterHash,
      selectedCandidate: null
    });
    setScreen('ballot');
  }, []);

  const handleVoteSelected = useCallback((candidate: Candidate) => {
    if (session) {
      setSession({ ...session, selectedCandidate: candidate });
      setScreen('confirmation');
    }
  }, [session]);

  const handleConfirmVote = useCallback(async () => {
    if (!session?.selectedCandidate) return;
    
    setIsSubmitting(true);

    try {
      // Encrypt the vote
      const votePayload = {
        candidateId: session.selectedCandidate.id,
        candidateName: session.selectedCandidate.name,
        party: session.selectedCandidate.party,
        constituencyId: session.constituency.id
      };
      
      const { encryptedVote } = await encryptVoteRSA(votePayload);
      
      // Add to blockchain
      const result = await addVote(
        blockchainState,
        encryptedVote,
        session.voterHash,
        4 // Difficulty
      );
      
      setBlockchainState(result.state);
      setLastBlock(result.block);
      setLastMiningTime(result.miningTime);
      setScreen('receipt');
    } catch (error) {
      console.error('Vote submission error:', error);
      // In production, show error UI
    } finally {
      setIsSubmitting(false);
    }
  }, [session, blockchainState]);

  const handleNewVote = useCallback(() => {
    if (session) {
      setSession({ ...session, selectedCandidate: null });
      setScreen('ballot');
    }
  }, [session]);

  const handleExit = useCallback(() => {
    setSession(null);
    setLastBlock(null);
    setLastMiningTime(0);
    setScreen('login');
  }, []);

  const handleAdminLogout = useCallback(() => {
    setScreen('login');
  }, []);

  // Render appropriate screen
  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return (
          <VoterLogin 
            onAuthenticated={handleAuthenticated}
            onHelpRequest={() => setShowAIAssistant(true)}
          />
        );
      
      case 'ballot':
        if (!session) return null;
        return (
          <BallotScreen
            constituency={session.constituency}
            onVoteSelected={handleVoteSelected}
            onCancel={handleExit}
          />
        );
      
      case 'confirmation':
        if (!session?.selectedCandidate) return null;
        return (
          <VoteConfirmation
            candidate={session.selectedCandidate}
            constituency={session.constituency}
            onConfirm={handleConfirmVote}
            onBack={() => setScreen('ballot')}
            isSubmitting={isSubmitting}
          />
        );
      
      case 'receipt':
        if (!lastBlock) return null;
        return (
          <VoteReceipt
            block={lastBlock}
            miningTime={lastMiningTime}
            onNewVote={handleNewVote}
            onExit={handleExit}
            onHelp={() => setShowAIAssistant(true)}
          />
        );
      
      case 'admin-login':
        return (
          <AdminLogin
            onAuthenticated={() => setScreen('admin-dashboard')}
            onCancel={handleExit}
          />
        );
      
      case 'admin-dashboard':
        return (
          <AdminDashboard
            blockchainState={blockchainState}
            onLogout={handleAdminLogout}
          />
        );
      
      default:
        return null;
    }
  };

  // Don't show header on admin screens
  const showHeader = !['admin-login', 'admin-dashboard'].includes(screen);

  return (
    <div className="min-h-screen bg-background kiosk-mode">
      {showHeader && <ElectoralHeader />}
      
      {renderScreen()}
      
      {/* AI Assistant */}
      {showHeader && (
        <>
          <AIAssistantTrigger onClick={() => setShowAIAssistant(true)} />
          <AIAssistant 
            isOpen={showAIAssistant} 
            onClose={() => setShowAIAssistant(false)} 
          />
        </>
      )}
      
      {/* Admin Access Hint (visible in demo) */}
      {screen === 'login' && (
        <button
          onClick={() => setScreen('admin-login')}
          className="fixed bottom-6 left-6 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-50 hover:opacity-100"
        >
          <Settings className="h-4 w-4" />
          Admin Access
        </button>
      )}
    </div>
  );
}
