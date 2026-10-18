// Edit server .cfg files in place. Written with writeFile (same inode), not
// temp+rename: hldm bind-mounts some of these as single files, which would keep
// pointing at the old inode after a rename.
import { readFile, writeFile } from 'node:fs/promises';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lineRe = (name: string) => new RegExp(`^[ \\t]*${esc(name)}[ \\t]+(.*?)[ \\t]*\\r?$`, 'm');
const unquote = (v: string) => v.replace(/\/\/.*$/, '').trim().replace(/^"(.*)"$/, '$1');

export const readCfg = (file: string) => readFile(file, 'latin1').catch(() => '');
export const writeCfg = (file: string, text: string) => writeFile(file, text, 'latin1');

/** Value of the first active `name value` line, or null. */
export function getLine(text: string, name: string): string | null {
	const m = lineRe(name).exec(text);
	return m ? unquote(m[1]) : null;
}

/** Replace the first active `name ...` line, or append one. */
export function setLine(text: string, name: string, value: string): string {
	const line = `${name} "${value}"`;
	const re = lineRe(name);
	if (re.test(text)) return text.replace(re, line);
	return `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
}

// jk_botti.cfg: bots come from `addbot` lines, default skill from `botskill`
const ADDBOT_RE = /^[ \t]*addbot\b.*\r?\n?/gm;
const BOTSKILL_RE = /^[ \t]*botskill\b.*\r?\n?/gm;

export function jkBotDefaults(text: string): { bots: number; skill: number } {
	const skill = [...text.matchAll(/^[ \t]*botskill[ \t]+"?(\d)/gm)].at(-1)?.[1];
	return { bots: text.match(ADDBOT_RE)?.length ?? 0, skill: Number(skill ?? 3) };
}

export function setJkBotDefaults(text: string, bots: number, skill: number): string {
	const rest = text.replace(ADDBOT_RE, '').replace(BOTSKILL_RE, '').replace(/\n*$/, '\n');
	return `${rest}botskill ${skill}\n${'addbot\n'.repeat(bots)}`;
}
