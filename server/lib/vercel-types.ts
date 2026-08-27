import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Minimal shape of the request/response Vercel's Node runtime hands a
 * serverless function — enough to type our handlers without pulling in
 * @vercel/node (whose transitive deps carry unrelated CVEs we don't need
 * for a types-only import).
 */
export interface VercelRequest extends IncomingMessage {
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
}

export interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
}
