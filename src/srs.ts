import type { Flashcard, FlashcardState, UserStatusOverride } from './types';

export const LEARNT_INTERVAL_DAYS = 21;

export const getEffectiveState = (card: Flashcard): FlashcardState => {
  if (card.user_status_override === 'LEARNT') return 'learnt';
  if (card.user_status_override === 'STILL_LEARNING') return 'review';
  return card.srs_interval && card.srs_interval >= LEARNT_INTERVAL_DAYS ? 'learnt' : card.state;
};

export const applyManualStatus = (card: Flashcard, state: FlashcardState): Flashcard => {
  const override: UserStatusOverride = state === 'learnt' ? 'LEARNT' : state === 'review' ? 'STILL_LEARNING' : null;
  return { ...card, state, user_status_override: override };
};

export const applyQuizScore = (card: Flashcard, score: 0 | 1 | 2 | 3, reviewedAt = new Date()): Flashcard => {
  const priorInterval = card.srs_interval ?? 0;
  const priorEase = Math.max(1.3, card.srs_ease_factor ?? 2.5);
  const priorRepetitions = card.srs_repetitions ?? 0;
  const lastReview = card.last_reviewed_at ? new Date(card.last_reviewed_at) : null;
  const elapsedDays = lastReview && !Number.isNaN(lastReview.valueOf())
    ? Math.max(1, Math.floor((reviewedAt.valueOf() - lastReview.valueOf()) / 86_400_000))
    : 1;

  let interval: number;
  let ease: number;
  let repetitions: number;
  let override = card.user_status_override ?? null;

  if (score === 0) {
    interval = 1;
    ease = Math.max(1.3, priorEase - 0.2);
    repetitions = 0;
    override = null;
  } else {
    repetitions = priorRepetitions + 1;
    ease = Math.min(3, Math.max(1.3, priorEase + (score - 2) * 0.1));
    const isEarly = priorInterval > 0 && elapsedDays < priorInterval;
    if (isEarly) {
      const bonusFactor = 1 + (ease - 1) * (elapsedDays / priorInterval);
      interval = Math.max(1, Math.round(priorInterval * bonusFactor));
    } else if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(Math.max(priorInterval, elapsedDays) * ease));
    }
    if (interval >= LEARNT_INTERVAL_DAYS) override = null;
  }

  const state: FlashcardState = score === 0 || interval < LEARNT_INTERVAL_DAYS
    ? 'review'
    : 'learnt';
  const nextDue = new Date(reviewedAt.valueOf() + interval * 86_400_000).toISOString();
  return {
    ...card,
    state: override === 'LEARNT' ? 'learnt' : override === 'STILL_LEARNING' ? 'review' : state,
    srs_interval: interval,
    srs_ease_factor: ease,
    srs_repetitions: repetitions,
    last_reviewed_at: reviewedAt.toISOString(),
    next_review_due: nextDue,
    user_status_override: override,
  };
};
