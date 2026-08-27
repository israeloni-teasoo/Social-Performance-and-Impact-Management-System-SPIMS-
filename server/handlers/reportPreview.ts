import Anthropic from '@anthropic-ai/sdk';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

interface ReportSectionInput {
  heading: string;
  lines: string[];
}

interface Slide {
  title: string;
  bullets: string[];
}

const SYSTEM_PROMPT =
  'You turn a compiled corporate social-performance report into a tight slide-by-slide outline for a board presentation. ' +
  'Output ONLY valid JSON: an array of objects, each shaped { "title": string, "bullets": string[] }. ' +
  'Keep bullets short (under 20 words each), factual, and grounded strictly in the source content provided — never invent figures or claims that are not in the source.';

export async function generateReportPreviewHandler(
  input: { reportName?: unknown; lens?: unknown; scopeNote?: unknown; sections?: unknown },
  user: User | null,
): Promise<HandlerResult<{ slides?: Slide[]; error?: string }>> {
  if (!user) return { status: 401, body: { error: 'Not signed in.' } };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { status: 503, body: { error: "Claude isn't configured yet — add ANTHROPIC_API_KEY to the server environment to enable this preview." } };
  }

  const reportName = typeof input.reportName === 'string' ? input.reportName : 'Report';
  const lens = typeof input.lens === 'string' ? input.lens : '';
  const scopeNote = typeof input.scopeNote === 'string' ? input.scopeNote : '';
  const sections = Array.isArray(input.sections) ? (input.sections as ReportSectionInput[]) : [];

  if (sections.length === 0) return { status: 400, body: { error: 'No report content was provided.' } };

  const sourceText = sections.map((s) => `## ${s.heading}\n${s.lines.map((l) => `- ${l}`).join('\n')}`).join('\n\n');

  const client = new Anthropic({ apiKey });
  let raw: string;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Report: ${reportName} (${lens} lens). ${scopeNote}\n\nSource content:\n${sourceText}\n\nProduce the slide outline as JSON.` }],
    });
    const textBlock = message.content.find((b) => b.type === 'text');
    raw = textBlock && 'text' in textBlock ? textBlock.text : '';
  } catch (err) {
    return { status: 502, body: { error: err instanceof Error ? `Claude API error: ${err.message}` : 'Claude API call failed.' } };
  }

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const slides = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Slide[];
    return { status: 200, body: { slides } };
  } catch {
    return { status: 502, body: { error: "Claude's response could not be parsed as a slide outline." } };
  }
}
