import { isGame, type GameId } from '$lib/games';

export const match = (param: string): param is GameId => isGame(param);
