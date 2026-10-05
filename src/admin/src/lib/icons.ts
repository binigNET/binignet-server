// Stock WC3 TFT chat icons. Code = `<tier><race>3W`, stored verbatim in Record\W3XP\userselected_icon.
// Images in static/icons/<code>.png (tier 2-6 from warcraft.wiki.gg, tier 1 cropped).
export type WarIcon = { code: string; name: string };
export type Race = { key: string; label: string; icons: WarIcon[] };

const race = (key: string, label: string, names: string[]): Race => ({
	key,
	label,
	icons: names.map((name, i) => ({ code: `${i + 1}${key}3W`, name }))
});

export const RACES: Race[] = [
	race('H', 'Humans', ['Peon', 'Rifleman', 'Sorceress', 'Spellbreaker', 'Blood Mage', 'Jaina']),
	race('O', 'Orcs', ['Peon', 'Troll Headhunter', 'Shaman', 'Spirit Walker', 'Shadow Hunter', 'Rexxar']),
	race('N', 'Night Elves', ['Peon', 'Huntress', 'Druid of the Talon', 'Dryad', 'Keeper of the Grove', 'Maiev']),
	race('U', 'Undead', ['Peon', 'Crypt Fiend', 'Banshee', 'Destroyer', 'Crypt Lord', 'Sylvanas']),
	race('R', 'Random', ['Peon', 'Myrmidon', 'Siren', 'Dragon Turtle', 'Sea Witch', 'Illidan']),
	race('D', 'Tournament', ['Peon', 'Felguard', 'Infernal', 'Doomguard', 'Pit Lord', 'Archimonde'])
];

export const iconSrc = (code: string) => `/icons/${code}.png`;
export const findIcon = (code: string) => RACES.flatMap((r) => r.icons).find((i) => i.code === code);
