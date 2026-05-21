export type CommunicationLog = {
  id: string;
  createdAt: string;
  scenario: string;
  pressureLevel: number;
  blufScore: boolean;
  ruleOf3Score: boolean;
  frazzleTrigger?: string | null;
  idealRewrite?: string | null;
};

export type TurnData = {
  id: string;
  createdAt: string;
  speaker: string;
  transcript: string;
  blufScore?: boolean | null;
  ruleOf3Score?: boolean | null;
  critique?: string | null;
  wordCount?: number | null;
};

export type SessionData = {
  id: string;
  createdAt: string;
  scenario?: string | null;
  pressureLevel?: number | null;
  duration?: number | null;
  blufAccuracy?: number | null;
  rule3Accuracy?: number | null;
  weekNumber?: number | null;
  turns: TurnData[];
};
