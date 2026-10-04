// Server-sent events: aura's log lines, live. Event ids are docker timestamps, so a
// reconnecting EventSource (Last-Event-ID) resumes right after the last line it got.
import { LOG_SOURCES, followLogs, tsToNs, type LogLine } from '$lib/server/docker/logs';

const TAIL = 300;
const RETRY_MS = 5000;
const PING_MS = 15_000;

export const GET = ({ request }) => {
	const container = LOG_SOURCES.aura;
	const ac = new AbortController();
	request.signal.addEventListener('abort', () => ac.abort());
	const resumeId = request.headers.get('last-event-id');
	let lastNs: bigint | undefined = resumeId ? tsToNs(resumeId) : undefined;

	const enc = new TextEncoder();
	let closed = false;
	let ping: NodeJS.Timeout;

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (s: string) => {
				if (closed) return;
				try {
					controller.enqueue(enc.encode(s));
				} catch {
					closed = true;
				}
			};
			const status = (state: 'live' | 'down', error = '') =>
				send(`event: status\ndata: ${JSON.stringify({ state, error })}\n\n`);
			const onLine = (l: LogLine) => {
				const ns = tsToNs(l.ts);
				// docker's `since` is inclusive; skip what the client already has
				if (lastNs !== undefined && ns <= lastNs) return;
				lastNs = ns;
				send(`id: ${l.ts}\ndata: ${JSON.stringify({ ts: l.ts, s: l.stream, t: l.text })}\n\n`);
			};

			send(`retry: ${RETRY_MS}\n\n`);
			ping = setInterval(() => send(': ping\n\n'), PING_MS);

			while (!ac.signal.aborted && !closed) {
				try {
					await followLogs(
						container,
						lastNs === undefined ? { tail: TAIL, signal: ac.signal } : { sinceNs: lastNs, signal: ac.signal },
						() => status('live'),
						onLine
					);
					if (ac.signal.aborted) break;
					status('down', `${container} stopped`);
				} catch (e) {
					if (ac.signal.aborted) break;
					status('down', (e as Error).message);
				}
				await new Promise<void>((r) => {
					const t = setTimeout(r, RETRY_MS);
					ac.signal.addEventListener('abort', () => (clearTimeout(t), r()), { once: true });
				});
			}
			clearInterval(ping);
			if (!closed) {
				closed = true;
				try {
					controller.close();
				} catch {}
			}
		},
		cancel() {
			closed = true;
			clearInterval(ping);
			ac.abort();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache',
			'x-accel-buffering': 'no'
		}
	});
};
