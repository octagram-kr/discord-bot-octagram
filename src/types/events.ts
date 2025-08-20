export interface SummarizePrEvent {
  type: 'SUMMARIZE_PR';
  content: string;
  callback: (summary: string | null, isAiSummary: boolean) => void;
}

export type AppEvent = SummarizePrEvent;