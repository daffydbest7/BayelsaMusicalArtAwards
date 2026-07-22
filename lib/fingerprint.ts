/**
 * lib/fingerprint.ts
 *
 * Client-side voter fingerprint generation using FingerprintJS.
 * Returns a stable visitor ID hash used as the sole hard-match key
 * for vote eligibility (see REQUIREMENTS.md §5.4).
 *
 * Usage: const hash = await getFingerprint();
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null;

/**
 * Returns a stable fingerprint hash for the current browser/device.
 * Lazy-loads the FingerprintJS agent on first call and caches it.
 */
export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }

  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId;
}
