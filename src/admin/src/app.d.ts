import type { User } from '$lib/access';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
	}
}

export {};
