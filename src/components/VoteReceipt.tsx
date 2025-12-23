import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Shield, Hash, Clock, RotateCcw, HelpCircle } from 'lucide-react';
import type { Block } from '@/lib/blockchain';

interface VoteReceiptProps {
  block: Block;
  miningTime: number;
  onNewVote: () => void;
  onExit: () => void;
  onHelp: () => void;
}

export function VoteReceipt({ block, miningTime, onNewVote, onExit, onHelp }: VoteReceiptProps) {
  const [countdown, setCountdown] = useState(30);

  // Auto-exit countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExit]);

  return (
    <div className="flex min-h-[calc(100vh-88px)] items-center justify-center p-8">
      <div className="w-full max-w-xl animate-scale-in">
        {/* Success Animation */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 relative">
            <div className="h-24 w-24 mx-auto rounded-full bg-success/20 flex items-center justify-center animate-pulse-secure">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <div className="absolute inset-0 h-24 w-24 mx-auto rounded-full border-4 border-success/30 animate-ping" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Vote Recorded</h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Your vote has been securely encrypted and added to the blockchain
          </p>
        </div>

        {/* Receipt Card */}
        <div className="electoral-card mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Vote Receipt</h3>
            <span className="electoral-badge electoral-badge-secure">
              <Shield className="h-3 w-3" />
              Verified
            </span>
          </div>

          <div className="space-y-4">
            {/* Block Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span className="text-sm">Block Number</span>
              </div>
              <span className="font-mono font-semibold text-foreground">
                #{block.index.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Timestamp</span>
              </div>
              <span className="font-mono text-sm text-foreground">
                {new Date(block.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Block Hash */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Block Hash</span>
              </div>
              <div className="blockchain-hash p-3 rounded-md bg-secondary/50 border border-border">
                {block.hash}
              </div>
            </div>

            {/* Previous Hash */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <span className="text-sm">Previous Block Hash</span>
              </div>
              <div className="blockchain-hash p-3 rounded-md bg-secondary/50 border border-border text-xs opacity-75">
                {block.previousHash.substring(0, 32)}...
              </div>
            </div>

            {/* Mining Info */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Proof-of-Work Time</span>
              <span className="text-sm font-medium text-foreground">{miningTime}ms</span>
            </div>
          </div>
        </div>

        {/* Coercion Note */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-card p-4">
          <RotateCcw className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Vote Again?</p>
            <p className="text-muted-foreground">
              If you feel your vote was observed or coerced, you may vote again. 
              Only your most recent vote will be counted in the final tally.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onNewVote}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-5 w-5" />
            Vote Again
          </Button>
          
          <Button
            variant="electoral"
            size="lg"
            onClick={onExit}
            className="flex-1"
          >
            Complete & Exit ({countdown}s)
          </Button>
        </div>

        {/* Help Link */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelp}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Need Assistance?
          </Button>
        </div>
      </div>
    </div>
  );
}
