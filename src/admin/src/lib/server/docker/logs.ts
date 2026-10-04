// Follow a container's logs through the read-only docker-proxy (see docker-compose.yml).
import http from 'node:http';
import { config } from '../env';

/** Containers whose logs the dashboard may show, by source key. */
export const LOG_SOURCES = { aura: 'aura' } as const;

export type LogLine = { ts: string; stream: 'out' | 'err'; text: string };

// aura prefixes every line with its own UTC [HH:MM:SS]; we show docker's timestamp instead
const AURA_TIME_RE = /^\[\d\d:\d\d:\d\d\] /;

/** RFC3339Nano → nanoseconds since epoch, for ordering and docker's `since`. */
export function tsToNs(ts: string): bigint {
	const m = /^(.*?)(?:\.(\d+))?Z$/.exec(ts);
	if (!m) return 0n;
	const frac = (m[2] ?? '').padEnd(9, '0').slice(0, 9);
	return BigInt(Date.parse(m[1] + 'Z')) * 1_000_000n + BigInt(frac);
}

const nsToSince = (ns: bigint) => `${ns / 1_000_000_000n}.${String(ns % 1_000_000_000n).padStart(9, '0')}`;

/**
 * Stream log lines until the container stops (resolves) or the request fails (throws).
 * `onAttach` fires once docker accepts the request.
 */
export function followLogs(
	container: string,
	opts: { tail?: number; sinceNs?: bigint; signal: AbortSignal },
	onAttach: () => void,
	onLine: (line: LogLine) => void
): Promise<void> {
	const q = new URLSearchParams({ stdout: '1', stderr: '1', follow: '1', timestamps: '1' });
	if (opts.sinceNs !== undefined) q.set('since', nsToSince(opts.sinceNs));
	else q.set('tail', String(opts.tail ?? 300));
	const url = `${config.dockerApi()}/containers/${encodeURIComponent(container)}/logs?${q}`;

	return new Promise((resolve, reject) => {
		const req = http.get(url, { signal: opts.signal }, (res) => {
			if (res.statusCode !== 200) {
				let body = '';
				res.setEncoding('utf8');
				res.on('data', (c) => (body += c));
				res.on('end', () => {
					const msg = res.statusCode === 404 ? `${container} not running` : body.trim() || `docker ${res.statusCode}`;
					reject(new Error(msg));
				});
				return;
			}
			onAttach();
			// non-TTY containers multiplex stdout/stderr: [type, 0, 0, 0, size uint32 BE] + payload
			let acc: Buffer = Buffer.alloc(0);
			const partial = { out: '', err: '' };
			res.on('data', (chunk: Buffer) => {
				acc = acc.length ? Buffer.concat([acc, chunk]) : chunk;
				while (acc.length >= 8) {
					const size = acc.readUInt32BE(4);
					if (acc.length < 8 + size) break;
					const stream = acc[0] === 2 ? 'err' : 'out';
					const text = partial[stream] + acc.subarray(8, 8 + size).toString('utf8');
					acc = acc.subarray(8 + size);
					const lines = text.split('\n');
					partial[stream] = lines.pop() ?? '';
					for (const raw of lines) {
						const sp = raw.indexOf(' ');
						if (sp < 0) continue;
						onLine({ ts: raw.slice(0, sp), stream, text: raw.slice(sp + 1).replace(/\r$/, '').replace(AURA_TIME_RE, '') });
					}
				}
			});
			res.on('end', () => resolve());
			res.on('error', reject);
		});
		req.on('error', (e) => reject(opts.signal.aborted ? new Error('aborted') : e));
	});
}
