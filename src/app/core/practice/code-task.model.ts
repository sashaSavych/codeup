export interface VerificationResult {
  ok: boolean;
  message?: string;
  /** 1-based line in the user editor for inline squiggles (Monaco markers). */
  markerLine?: number;
  /** 1-based column (optional; defaults to start of line). */
  markerColumn?: number;
}

/** One coding exercise bound to a topic `slug` from `topics`. */
export interface CodeTask {
  id: string;
  topicSlug: string;
  order: number;
  title: string;
  description: string;
  starterCode: string;
  /** Runs learner code in browser via `new Function` + harness (trusted educational sandbox only). */
  verify: (code: string) => VerificationResult | Promise<VerificationResult>;
}
