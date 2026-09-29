// Persistent admin session to bnetd's telnet interface (see SPIKE.md).
// Replies are free text; many successes start with "ERROR:", so callers match on text.
// Never log reply contents: /addacct echoes passwords.
import net from 'node:net';
import { config } from '../env';

type State = 'disconnected' | 'connecting' | 'ready';
type Collector = { lines: string[]; touch: () => void };
type WhisperListener = (from: string, msg: string) => void;

// bnetd quota: 5 lines / 5s
const SEND_GAP_MS = 1200;
const WHISPER_RE = /^<from (\S+)> (.*)$/;

const unescape = (s: string) => s.replace(/\\(["\\])/g, '$1');

class PvpgnTelnet {
	state: State = 'disconnected';
	lastError = '';
	private sock: net.Socket | null = null;
	private buf = '';
	private collector: Collector | null = null;
	private whisperListeners = new Set<WhisperListener>();
	private queue: Promise<unknown> = Promise.resolve();
	private lastSend = 0;
	private backoff = 2000;
	private ready: Promise<void> | null = null;

	connect(): Promise<void> {
		if (this.ready) return this.ready;
		const { host, port, user, pass } = config.pvpgn();
		this.state = 'connecting';
		this.ready = new Promise((resolve, reject) => {
			const sock = net.createConnection({ host, port });
			this.sock = sock;
			this.buf = '';
			let loggedIn = false;
			let welcomed = false;
			sock.setEncoding('latin1');
			sock.setKeepAlive(true, 30_000);
			sock.on('data', (chunk: string) => {
				this.buf += chunk;
				if (!loggedIn) {
					if (this.buf.endsWith('Username: ')) {
						this.buf = '';
						sock.write(user + '\r\n');
					} else if (this.buf.endsWith('Password: ')) {
						this.buf = '';
						sock.write(pass + '\r\n');
					} else if (/Login failed|no bot access/.test(this.buf)) {
						this.lastError = this.buf.includes('bot access')
							? 'account has no bot access'
							: 'login failed';
						sock.destroy();
					} else if (!welcomed && this.buf.includes('Your unique name:')) {
						welcomed = true;
						// let the welcome text arrive, then drop it
						setTimeout(() => {
							loggedIn = true;
							this.buf = '';
							this.state = 'ready';
							this.lastError = '';
							this.backoff = 2000;
							resolve();
						}, 800);
					}
					return;
				}
				this.drain();
			});
			sock.on('error', (e) => (this.lastError = e.message));
			sock.on('close', () => {
				this.state = 'disconnected';
				this.sock = null;
				this.ready = null;
				if (!loggedIn) reject(new Error(this.lastError || 'connection closed'));
				setTimeout(() => this.connect().catch(() => {}), this.backoff);
				this.backoff = Math.min(this.backoff * 2, 30_000);
			});
		});
		return this.ready;
	}

	private drain() {
		let i: number;
		while ((i = this.buf.indexOf('\r\n')) >= 0) {
			const line = unescape(this.buf.slice(0, i));
			this.buf = this.buf.slice(i + 2);
			const w = WHISPER_RE.exec(line);
			if (w) for (const l of this.whisperListeners) l(w[1], w[2]);
			else if (this.collector && line) {
				this.collector.lines.push(line);
				this.collector.touch();
			}
		}
	}

	/** Run a slash command; returns reply lines (collected until quiet). Serialized + rate limited. */
	run(cmd: string, { quietMs = 600, maxMs = 4000 } = {}): Promise<string[]> {
		if (/[\r\n]/.test(cmd)) return Promise.reject(new Error('newline in command'));
		const job = this.queue.then(async () => {
			await this.connect();
			const wait = this.lastSend + SEND_GAP_MS - Date.now();
			if (wait > 0) await new Promise((r) => setTimeout(r, wait));
			return new Promise<string[]>((resolve) => {
				let quiet: NodeJS.Timeout;
				const done = () => {
					clearTimeout(quiet);
					clearTimeout(max);
					this.collector = null;
					resolve(c.lines);
				};
				const c: Collector = {
					lines: [],
					touch: () => {
						clearTimeout(quiet);
						quiet = setTimeout(done, quietMs);
					}
				};
				const max = setTimeout(done, maxMs);
				c.touch();
				this.collector = c;
				this.lastSend = Date.now();
				this.sock!.write(cmd + '\r\n');
			});
		});
		this.queue = job.catch(() => {});
		return job;
	}

	/** Whisper aura and collect its whispered replies. */
	async askAura(msg: string, { quietMs = 1500, maxMs = 6000 } = {}): Promise<string[]> {
		const bot = config.auraBot().toLowerCase();
		const replies: string[] = [];
		let resolveDone!: () => void;
		const finished = new Promise<void>((r) => (resolveDone = r));
		let quiet: NodeJS.Timeout | undefined;
		const listener: WhisperListener = (from, m) => {
			if (from.toLowerCase() !== bot) return;
			replies.push(m);
			clearTimeout(quiet);
			quiet = setTimeout(resolveDone, quietMs);
		};
		this.whisperListeners.add(listener);
		const max = setTimeout(resolveDone, maxMs);
		try {
			await this.run(`/w ${config.auraBot()} ${msg}`);
			await finished;
		} finally {
			clearTimeout(quiet);
			clearTimeout(max);
			this.whisperListeners.delete(listener);
		}
		return replies;
	}
}

const g = globalThis as unknown as { __pvpgn?: PvpgnTelnet };
export const pvpgn = (g.__pvpgn ??= new PvpgnTelnet());
