export const ago = (d: Date | string) => {
	const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
	return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
};

export const until = (d: Date | string | null) => (d ? new Date(d).toLocaleString() : 'permanent');
