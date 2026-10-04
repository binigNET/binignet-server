export const ago = (d: Date | string) => {
	const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
	return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
};

export const until = (d: Date | string | null) => (d ? new Date(d).toLocaleString() : 'permanent');

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD HH:MM` in the viewer's timezone (render client-side only). */
export const localDateTime = (d: Date | string) => {
	const x = new Date(d);
	return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
};
