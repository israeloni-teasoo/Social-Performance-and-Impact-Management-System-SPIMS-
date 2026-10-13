/**
 * Naira formatting, shared by the analytics layer and the upload handler.
 *
 * It lives on its own, with no imports of its own, because the server imports it: every
 * module the server reaches is compiled into the serverless function, and a formatting
 * helper that drags the whole analytics layer and its dependencies in with it is one
 * import away from becoming a function that will not start.
 */

/**
 * Millions of naira as a compact label.
 *
 * Kept to two decimals below ₦10M, because the portfolio holds projects of a few million
 * naira as well as programmes of several hundred: rounding to the nearest million printed
 * "₦3M" at the top of a report whose budget line, two rows below, read "₦3.44M". The form
 * always carries an M or a B, so `budgetToMillions` reads it back.
 */
export function formatMillions(millions: number): string {
  if (millions >= 1000) return `₦${(millions / 1000).toFixed(2)}B`;
  if (millions >= 10) return `₦${Math.round(millions)}M`;
  return `₦${Number(millions.toFixed(2))}M`;
}
