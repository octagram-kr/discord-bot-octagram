export interface SummarizePrEvent {
  type: 'SUMMARIZE_PR';
  content: string;
  callback: (summary: string | null, isAiSummary: boolean) => void;
}

export type AppEvent = SummarizePrEvent; // Union 타입으로 확장 가능!