import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, Lock, ChevronLeft, Loader2 } from 'lucide-react';
import type { Candidate, Constituency } from '@/lib/database';

interface VoteConfirmationProps {
  candidate: Candidate;
  constituency: Constituency;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function VoteConfirmation({ 
  candidate, 
  constituency, 
  onConfirm, 
  onBack,
  isSubmitting 
}: VoteConfirmationProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-88px)] items-center justify-center p-8">
      <div className="w-full max-w-lg animate-scale-in">
        <div className="electoral-card">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Confirm Your Vote</h2>
            <p className="mt-2 text-muted-foreground">
              Please review your selection carefully
            </p>
          </div>

          {/* Vote Summary */}
          <div className="mb-8 rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {constituency.name}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {constituency.region}
              </p>
              
              <div className="py-4 border-t border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Your Vote For</p>
                <p className="text-2xl font-bold text-foreground">{candidate.name}</p>
                <p className="mt-2 text-lg text-primary">{candidate.party}</p>
                <div className="mt-2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-secondary text-lg font-bold">
                  {candidate.ballotPosition}
                </div>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-6 rounded-md border-2 border-border bg-background transition-all peer-checked:border-primary peer-checked:bg-primary group-hover:border-primary/50">
                  {hasAcknowledged && (
                    <Check className="h-full w-full p-0.5 text-primary-foreground" />
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                I confirm that I have reviewed my selection and wish to cast my vote 
                for <strong className="text-foreground">{candidate.name}</strong>. 
                I understand this action will be recorded on the electoral blockchain.
              </span>
            </label>
          </div>

          {/* Security Notice */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-secondary/50 p-4">
            <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Vote Security</p>
              <p>
                Your vote will be encrypted with RSA-2048 before being stored. 
                No one, including system administrators, can see how you voted.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Go Back
            </Button>
            
            <Button
              variant="electoral-gold"
              size="lg"
              onClick={onConfirm}
              disabled={!hasAcknowledged || isSubmitting}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Confirm Vote
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
