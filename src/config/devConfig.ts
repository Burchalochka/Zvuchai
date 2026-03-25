/**
 * Dev-only configuration. All flags here are for local development and manual
 * testing only — never ship with SEED_ENABLED or SKIP_ONBOARDING set to true.
 *
 * How to toggle:
 *   1. Open this file.
 *   2. Change the value of the flag you need.
 *   3. Reload the app (press 'r' in Metro or restart).
 */
export const DEV_CONFIG = {
  // ── Seed data ───────────────────────────────────────────────────────────────
  /** Set to true to inject mock data for manual testing. */
  SEED_ENABLED: true,

  /**
   * Controls what happens when the app launches with SEED_ENABLED = true.
   *
   * 'once'   — inject seed data only if all storages are empty.
   *            Safe for day-to-day dev work: your manual changes are preserved
   *            across restarts.
   *
   * 'always' — wipe all data and re-inject seed on every launch.
   *            Use for demos, screenshots, or when you need a clean known state.
   */
  SEED_MODE: 'always' as 'once' | 'always',

  // ── Navigation ──────────────────────────────────────────────────────────────
  /**
   * Skip splash → language selection → welcome → account creation screens.
   * Lands directly on the main tab navigator.
   * Set DEFAULT_LANGUAGE below to control which language is used.
   */
  SKIP_ONBOARDING: true,

  /** Language used when SKIP_ONBOARDING is true. */
  DEFAULT_LANGUAGE: 'uk' as 'uk' | 'en',
};
