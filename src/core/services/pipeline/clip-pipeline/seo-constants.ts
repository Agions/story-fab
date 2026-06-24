/**
 * SEO generator magic-number constants
 * All numeric literals extracted from seoGenerator.ts
 */

// ── Title truncation ──────────────────────────────────────────────────────────
// Title hard-cap for Weibo/Twitter (Chinese chars × 2 bytes ≈ char count)
const TITLE_MAX_LENGTH = 40;
// Minimum chars before a punctuation so we split there instead of hard-cutting
const TITLE_SENTENCE_BOUNDARY_MIN = 20;
// Headline fillet when no punctuation found
const TITLE_ELLIPSIS_SUFFIX = '...';

// ── Template interpolation ─────────────────────────────────────────────────────
const TEMPLATE_HOOK_LENGTH = 20;
const TEMPLATE_TOPIC_LENGTH = 15;
// Twitter/微博 bio maximum character length
const TEMPLATE_BIO_MAX_LENGTH = 60;
// Ellipsis used when bio exceeds TEMPLATE_BIO_MAX_LENGTH
const TEMPLATE_BIO_TRUNCATE_SUFFIX = '...';

// ── Hashtag generation ─────────────────────────────────────────────────────────
const HASHTAG_MAX_COUNT = 10;
const HASHTAG_WORDS_SAMPLE = 5;

export {
  TITLE_MAX_LENGTH,
  TITLE_SENTENCE_BOUNDARY_MIN,
  TITLE_ELLIPSIS_SUFFIX,
  TEMPLATE_HOOK_LENGTH,
  TEMPLATE_TOPIC_LENGTH,
  TEMPLATE_BIO_MAX_LENGTH,
  TEMPLATE_BIO_TRUNCATE_SUFFIX,
  HASHTAG_MAX_COUNT,
  HASHTAG_WORDS_SAMPLE,
};
