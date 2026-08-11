import responses from '../../data/responses.json';
import type { Citation } from '../types';

export interface Scenario {
  id: string;
  prompt: string;
  first_token_delay_ms: number;
  chunk_delay_ms: number;
  text: string;
  citations: Citation[];
  error?: string;
  fails_before_first_token?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Scenario ids you can stream, with the prompt each one answers. */
export function listScenarios() {
  return responses.scenarios.map(({ id, prompt }) => ({ id, prompt }));
}

/** The full record for a scenario — text, citations, timings. */
export function getScenario(id: string): Scenario {
  const s = (responses.scenarios as Scenario[]).find((x) => x.id === id);
  if (!s) {
    throw new Error(
      `Unknown scenario "${id}". Try: ${responses.scenarios.map((x) => x.id).join(', ')}`
    );
  }
  return s;
}

/**
 * Split text the way a model actually emits it: small pieces that do not respect
 * word, line, or markdown-syntax boundaries. A chunk can end in the middle of a
 * word, or between the two backticks of a fence.
 */
function chunkify(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  // Deterministic pseudo-random sizes: same input always splits the same way.
  let seed = 1337;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  while (i < text.length) {
    const size = 2 + Math.floor(next() * 6); // 2–7 characters
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}

/**
 * Stream one scenario. Yields string chunks.
 *
 * @param id                      scenario id from listScenarios()
 * @param opts
 * @param opts.signal      abort to stop early
 * @param opts.speed            multiplier on all delays; 0 streams instantly
 */
export async function* streamResponse(
  id: string,
  opts: { signal?: AbortSignal; speed?: number } = {}
): AsyncGenerator<string, void, unknown> {
  const { signal, speed = 1 } = opts;
  const scenario = getScenario(id);
  const chunks = chunkify(scenario.text);

  await sleep(scenario.first_token_delay_ms * speed);
  if (signal?.aborted) return;

  // fails_before_first_token: nothing is ever yielded. Distinct from failing partway,
  // because there is no half-written message to decide what to do with.
  if (scenario.error && scenario.fails_before_first_token) {
    throw new Error(scenario.error);
  }

  for (const chunk of chunks) {
    if (signal?.aborted) return;
    yield chunk;
    await sleep(scenario.chunk_delay_ms * speed);
  }

  // A scenario carrying an `error` holds deliberately truncated text: it streams
  // everything it has and then dies, which is what a dropped connection looks like.
  // Throwing here rather than on a timer keeps it deterministic regardless of `speed`.
  if (scenario.error) {
    throw new Error(scenario.error);
  }
}
