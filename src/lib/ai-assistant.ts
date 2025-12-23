/**
 * OFFLINE AI ASSISTANT
 * 
 * TECHNICAL AFFIDAVIT:
 * This implements a fully offline AI assistant that operates without
 * network connectivity. Responses are sourced exclusively from a local
 * knowledge base containing official voting rules and procedures.
 * 
 * Security Properties:
 * - No network requests (air-gapped operation)
 * - Cannot influence voter decisions
 * - Refuses political opinions and candidate recommendations
 * - Only procedural and navigational assistance
 */

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  category: 'procedure' | 'navigation' | 'technical' | 'accessibility';
}

// Local knowledge base - in production would be loaded from knowledge_base.json
const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'auth-1',
    keywords: ['login', 'sign in', 'authenticate', 'national id', 'pin'],
    question: 'How do I log in to vote?',
    answer: 'Enter your National ID number in the first field, then enter your 4-digit PIN in the second field. Press the "Authenticate" button to proceed. If you\'ve forgotten your PIN, please contact your local electoral office.',
    category: 'procedure'
  },
  {
    id: 'auth-2',
    keywords: ['locked', 'attempts', 'failed', 'too many'],
    question: 'My account is locked. What do I do?',
    answer: 'For security, accounts are locked after 3 failed login attempts. Please wait 5 minutes and try again. If you continue to have issues, ask a polling station officer for assistance.',
    category: 'procedure'
  },
  {
    id: 'vote-1',
    keywords: ['select', 'choose', 'candidate', 'vote', 'ballot'],
    question: 'How do I select a candidate?',
    answer: 'Tap or click on the candidate you wish to vote for. Their card will be highlighted to confirm your selection. You can change your selection at any time before confirming your vote.',
    category: 'procedure'
  },
  {
    id: 'vote-2',
    keywords: ['change', 'modify', 'different', 'switch'],
    question: 'Can I change my vote?',
    answer: 'Yes, you can change your selection as many times as you like before pressing "Confirm Vote". After confirmation, you can still vote again if needed - only your most recent vote will be counted.',
    category: 'procedure'
  },
  {
    id: 'vote-3',
    keywords: ['confirm', 'submit', 'final', 'cast'],
    question: 'How do I confirm my vote?',
    answer: 'After selecting your candidate, press the "Review Selection" button. You will see a confirmation screen showing your choice. Press "Confirm Vote" to cast your ballot. A receipt will be displayed.',
    category: 'procedure'
  },
  {
    id: 'security-1',
    keywords: ['secure', 'safe', 'encrypted', 'privacy', 'secret'],
    question: 'Is my vote secure and private?',
    answer: 'Yes. Your vote is encrypted using RSA-2048 encryption before being stored. The vote is separated from your identity using cryptographic techniques. No one, including administrators, can see how you voted.',
    category: 'technical'
  },
  {
    id: 'security-2',
    keywords: ['blockchain', 'tamper', 'change', 'alter'],
    question: 'Can votes be tampered with?',
    answer: 'No. All votes are stored in a tamper-evident blockchain. Each vote is cryptographically linked to the previous one. Any attempt to modify a vote would be immediately detectable through chain validation.',
    category: 'technical'
  },
  {
    id: 'nav-1',
    keywords: ['help', 'assistance', 'support', 'officer'],
    question: 'Where can I get help?',
    answer: 'You can use this AI assistant for procedural questions. For technical issues or accessibility needs, please ask a polling station officer. They are available to assist you throughout the voting process.',
    category: 'navigation'
  },
  {
    id: 'nav-2',
    keywords: ['home', 'start', 'beginning', 'restart'],
    question: 'How do I return to the start?',
    answer: 'After completing your vote, the system will automatically return to the login screen. If you need to restart during the voting process, ask a polling station officer for assistance.',
    category: 'navigation'
  },
  {
    id: 'access-1',
    keywords: ['large', 'text', 'font', 'size', 'bigger'],
    question: 'Can I make the text larger?',
    answer: 'The kiosk is designed with large, readable text. If you need additional assistance with reading the screen, please ask a polling station officer who can provide accessibility accommodations.',
    category: 'accessibility'
  },
  {
    id: 'access-2',
    keywords: ['audio', 'voice', 'hear', 'listen', 'blind'],
    question: 'Is there audio assistance available?',
    answer: 'Audio assistance is available upon request. Please ask a polling station officer to enable audio guidance. Headphones will be provided for privacy.',
    category: 'accessibility'
  },
  {
    id: 'time-1',
    keywords: ['time', 'limit', 'hurry', 'rush', 'long'],
    question: 'Is there a time limit for voting?',
    answer: 'There is no strict time limit. Take as much time as you need to make your decision. However, please be mindful of other voters waiting.',
    category: 'procedure'
  },
  {
    id: 'multiple-1',
    keywords: ['multiple', 'again', 'twice', 'revote'],
    question: 'Can I vote multiple times?',
    answer: 'You may cast multiple ballots during your session. This is a security feature that allows you to change your vote if you feel coerced. Only your most recent vote will be counted in the final tally.',
    category: 'procedure'
  }
];

// Blocked topics - political content
const BLOCKED_PATTERNS = [
  /who should i vote for/i,
  /which candidate is better/i,
  /recommend.*candidate/i,
  /best.*candidate/i,
  /opinion.*party/i,
  /political.*advice/i,
  /which party/i,
  /should i choose/i,
  /who.*win/i,
  /election.*prediction/i,
  /policy.*position/i,
  /platform/i,
  /endorse/i,
  /support.*party/i,
  /vote.*for/i
];

export interface AIResponse {
  type: 'answer' | 'blocked' | 'unknown';
  message: string;
  sources?: string[];
  confidence: number;
}

/**
 * Process user query and return appropriate response
 * 
 * This is a simulated offline LLM - in production would use
 * a quantized local model like LLaMA or Phi
 */
export function processQuery(query: string): AIResponse {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for blocked political content
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return {
        type: 'blocked',
        message: 'I am unable to provide political opinions, candidate recommendations, or voting advice. I can only assist with voting procedures and navigation. Please make your own independent decision.',
        confidence: 1.0
      };
    }
  }
  
  // Find matching knowledge entries
  const matches: { entry: KnowledgeEntry; score: number }[] = [];
  
  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    
    // Check keyword matches
    for (const keyword of entry.keywords) {
      if (normalizedQuery.includes(keyword)) {
        score += 2;
      }
    }
    
    // Check question similarity (simple word overlap)
    const queryWords = normalizedQuery.split(/\s+/);
    const questionWords = entry.question.toLowerCase().split(/\s+/);
    
    for (const word of queryWords) {
      if (word.length > 3 && questionWords.includes(word)) {
        score += 1;
      }
    }
    
    if (score > 0) {
      matches.push({ entry, score });
    }
  }
  
  // Sort by score and return best match
  matches.sort((a, b) => b.score - a.score);
  
  if (matches.length > 0 && matches[0].score >= 2) {
    const bestMatch = matches[0];
    return {
      type: 'answer',
      message: bestMatch.entry.answer,
      sources: [bestMatch.entry.id],
      confidence: Math.min(bestMatch.score / 6, 1.0)
    };
  }
  
  // No match found
  return {
    type: 'unknown',
    message: 'I don\'t have specific information about that topic. I can help with: logging in, selecting candidates, confirming your vote, security questions, and accessibility options. Please try rephrasing your question or ask a polling station officer for assistance.',
    confidence: 0.3
  };
}

/**
 * Get suggested questions for user
 */
export function getSuggestedQuestions(): string[] {
  return [
    'How do I log in to vote?',
    'Can I change my vote?',
    'Is my vote secure?',
    'How do I confirm my vote?',
    'Where can I get help?'
  ];
}
