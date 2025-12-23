import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import type { Constituency, Candidate } from '@/lib/database';

interface BallotScreenProps {
  constituency: Constituency;
  onVoteSelected: (candidate: Candidate) => void;
  onCancel: () => void;
}

export function BallotScreen({ constituency, onVoteSelected, onCancel }: BallotScreenProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const handleProceed = () => {
    if (selectedCandidate) {
      onVoteSelected(selectedCandidate);
    }
  };

  // Generate consistent party colors
  const getPartyColor = (party: string): string => {
    const colors: Record<string, string> = {
      'Progressive Alliance': 'hsl(217 91% 60%)',
      'Unity Coalition': 'hsl(142 76% 36%)',
      'Civic Reform Party': 'hsl(38 92% 50%)',
      'Independent': 'hsl(215 20% 55%)',
      'Rural First Party': 'hsl(25 95% 53%)',
      'Maritime Alliance': 'hsl(199 89% 48%)',
      'Highland Heritage Party': 'hsl(262 83% 58%)',
      'Agricultural Workers Union': 'hsl(45 93% 47%)',
    };
    return colors[party] || 'hsl(215 20% 55%)';
  };

  return (
    <div className="flex min-h-[calc(100vh-88px)] flex-col p-8">
      {/* Ballot Header */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-secure" />
          <span className="text-sm font-medium text-primary">Official Ballot</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground">{constituency.name}</h2>
        <p className="mt-2 text-lg text-muted-foreground">{constituency.region}</p>
      </div>

      {/* Instructions */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-card p-4 max-w-2xl mx-auto animate-slide-up">
        <Info className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Voting Instructions</p>
          <p>Select one candidate by clicking on their card. You can change your selection before proceeding. Your vote is encrypted and your choice is secret.</p>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <div className="grid gap-4 sm:grid-cols-2">
          {constituency.candidates.map((candidate, index) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className={`ballot-option text-left ${
                selectedCandidate?.id === candidate.id ? 'selected' : ''
              }`}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-start gap-4">
                {/* Ballot Position */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-xl font-bold text-secondary-foreground flex-shrink-0">
                  {candidate.ballotPosition}
                </div>

                {/* Candidate Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {candidate.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${getPartyColor(candidate.party)}20`,
                        color: getPartyColor(candidate.party),
                        border: `1px solid ${getPartyColor(candidate.party)}40`
                      }}
                    >
                      {candidate.partyAbbrev}
                    </span>
                    <span className="text-sm text-muted-foreground truncate">
                      {candidate.party}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator */}
                <div className="radio-indicator flex items-center justify-center flex-shrink-0">
                  {selectedCandidate?.id === candidate.id && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="gap-2"
        >
          Cancel & Exit
        </Button>

        <div className="flex items-center gap-4">
          {selectedCandidate && (
            <div className="text-right animate-fade-in">
              <p className="text-sm text-muted-foreground">Selected</p>
              <p className="font-semibold text-foreground">{selectedCandidate.name}</p>
            </div>
          )}
          
          <Button
            variant="electoral"
            size="lg"
            onClick={handleProceed}
            disabled={!selectedCandidate}
            className="gap-2 min-w-[200px]"
          >
            Review Selection
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Coercion Notice */}
      <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground max-w-xl mx-auto">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Coercion Protection:</strong> You may vote multiple times during this session. 
          Only your final vote will be counted. If you feel pressured, continue voting and your 
          last choice will be the one recorded.
        </p>
      </div>
    </div>
  );
}
