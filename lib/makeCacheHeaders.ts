/**
 * Generates HTTP headers for caching and content type.
 *
 * @param {number} [seconds=604800] - The max-age value in seconds (default: one week).
 * @param {string} [etag="v1"] - The ETag identifier for cache validation.
 * @returns {HeadersInit} - An object containing headers for caching and response metadata.
 */
export function makeCacheHeaders(
  seconds: number = 604800,
  etag: string = Deno.env.get("STATIC_E_TAG") as string
): HeadersInit {
  const maxAge = seconds;
  const expiry = new Date(Date.now() + seconds * 1000).toUTCString();

  return {
    "Cache-Control": `public, max-age=${maxAge}`,
    Expires: expiry,
    ETag: etag,
  };
}
