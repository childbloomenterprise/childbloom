// Single source of truth for Anthropic model selection.
// Override per environment with ANTHROPIC_MODEL.

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

// Lightweight model for fast/low-cost calls (e.g. classification, summaries).
export const FAST_MODEL = process.env.ANTHROPIC_FAST_MODEL || 'claude-haiku-4-5-20251001';

export function corsOrigin() {
  return process.env.FRONTEND_ORIGIN || '*';
}
