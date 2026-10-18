// WC3 (pvpgn + aura) pages; root-level URLs, grouped under routes/(wc3)
export const WC3_LINKS = [
	['/players', 'Players'],
	['/games', 'Games'],
	['/bans', 'Bans'],
	['/messages', 'Messages'],
	['/maps', 'Maps'],
	['/saves', 'Saves'],
	['/banner', 'Banner'],
	['/logs', 'Logs']
] as const;

/** `href` is the current page or a parent of it */
export const under = (path: string, href: string) => path === href || path.startsWith(href + '/');
