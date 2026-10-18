// GoldSrc RCON over UDP: "challenge rcon" -> "rcon <challenge> "<pw>" <cmd>".
// Replies are 0xFFFFFFFF 'l' <text>, possibly split (0xFFFFFFFE header). No end marker,
// so a reply is collected until the socket goes quiet. Commands are serialized.
// ReHLDS bans the sender IP after a few bad passwords (sv_rcon_minfailures within
// sv_rcon_minfailuretime): after one "Bad rcon_password" we stop sending for a while.
import dgram from 'node:dgram';
import type { GameId } from '$lib/games';
import { config } from '../env';

type State = 'ok' | 'unreachable' | 'badpass' | 'nopass';

export const HEADER = Buffer.from([0xff, 0xff, 0xff, 0xff]);
const SPLIT = 0xfffffffe;
const BADPASS_BLOCK_MS = 10 * 60_000;
const ARG_RE = /^[^\r\n\0]+$/;

/** Send one request and collect reply packets until quiet. Resolves [] on timeout. */
export function exchange(
	host: string,
	port: number,
	payload: Buffer,
	{ firstMs, quietMs, maxMs }: { firstMs: number; quietMs: number; maxMs: number }
): Promise<Buffer[]> {
	return new Promise((resolve, reject) => {
		const sock = dgram.createSocket('udp4');
		const packets: Buffer[] = [];
		const splits = new Map<number, { total: number; parts: Buffer[] }>();
		let quiet = setTimeout(finish, firstMs);
		const max = setTimeout(finish, maxMs);
		function finish() {
			clearTimeout(quiet);
			clearTimeout(max);
			sock.close();
			resolve(packets);
		}
		sock.on('error', (e) => {
			clearTimeout(quiet);
			clearTimeout(max);
			sock.close();
			reject(e);
		});
		sock.on('message', (msg) => {
			if (msg.length < 5) return;
			if (msg.readUInt32LE(0) === SPLIT && msg.length > 9) {
				// int32 request id, byte: high nibble = index, low nibble = total
				const id = msg.readInt32LE(4);
				const total = msg[8] & 0x0f;
				const index = msg[8] >> 4;
				const s = splits.get(id) ?? { total, parts: [] };
				s.parts[index] = msg.subarray(9);
				splits.set(id, s);
				if (s.parts.filter(Boolean).length === total) {
					splits.delete(id);
					packets.push(Buffer.concat(s.parts));
				}
			} else if (msg.subarray(0, 4).equals(HEADER)) packets.push(msg);
			clearTimeout(quiet);
			quiet = setTimeout(finish, quietMs);
		});
		sock.connect(port, host, () => sock.send(payload));
	});
}

/** Text of an 'l' (print) reply packet, minus header, type byte and trailing NULs. */
const text = (p: Buffer) => p.subarray(5).toString('latin1').replace(/\0+$/, '');

class HldsRcon {
	state: State = 'ok';
	lastError = '';
	private queue: Promise<unknown> = Promise.resolve();
	private blockedUntil = 0;

	constructor(private game: GameId) {}

	/** Run a console command; returns its output ('' for silent commands). */
	run(cmd: string, { quietMs = 300, emptyMs = 700, maxMs = 4000 } = {}): Promise<string> {
		if (!ARG_RE.test(cmd)) return Promise.reject(new Error('invalid command'));
		const job = this.queue.then(async () => {
			const { host, port, password } = config.hlds(this.game);
			if (!password) {
				this.state = 'nopass';
				throw new Error('rcon password not set');
			}
			if (Date.now() < this.blockedUntil) throw new Error(this.lastError);
			try {
				const [ch] = await exchange(host, port, Buffer.concat([HEADER, Buffer.from('challenge rcon\n')]), {
					firstMs: 1500,
					quietMs: 50,
					maxMs: 1500
				});
				const m = ch && /^challenge rcon (-?\d+)/.exec(ch.subarray(4).toString('latin1'));
				if (!m) throw new Error('no reply (server down?)');
				const reply = await exchange(
					host,
					port,
					Buffer.concat([HEADER, Buffer.from(`rcon ${m[1]} "${password}" ${cmd}\n`, 'latin1')]),
					{ firstMs: emptyMs, quietMs, maxMs }
				);
				const out = reply.map(text).join('');
				if (/^Bad rcon_password/m.test(out)) {
					this.state = 'badpass';
					this.lastError = 'bad rcon password (paused 10 min to avoid an IP ban)';
					this.blockedUntil = Date.now() + BADPASS_BLOCK_MS;
					throw new Error(this.lastError);
				}
				if (/^You have been banned/m.test(out)) {
					this.state = 'badpass';
					this.lastError = 'admin IP banned by server (rcon failures)';
					this.blockedUntil = Date.now() + BADPASS_BLOCK_MS;
					throw new Error(this.lastError);
				}
				this.state = 'ok';
				this.lastError = '';
				return out;
			} catch (e) {
				if (this.state !== 'badpass' || Date.now() >= this.blockedUntil) {
					this.state = 'unreachable';
					this.lastError = (e as Error).message;
				}
				throw e;
			}
		});
		this.queue = job.catch(() => {});
		return job;
	}
}

const g = globalThis as unknown as { __hldsRcon?: Partial<Record<GameId, HldsRcon>> };
const instances = (g.__hldsRcon ??= {});
export const rcon = (game: GameId) => (instances[game] ??= new HldsRcon(game));
