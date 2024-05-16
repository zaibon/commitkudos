import { derived, type Readable } from 'svelte/store';

import type { Balance } from '$lib/types';

import { address, chainId } from './wallet';

export const balances = derived(
	[address, chainId],
	([$address, $chainId], set) => {
		if (!$address || !$chainId) {
			return;
		}
		getBalances($chainId.toString(), $address).then((balances) => {
			set(balances);
		});
	},
	[] as Balance[]
) as Readable<Balance[]>;

async function getBalances(chainId: string, address: string): Promise<Balance[]> {
	const resp = await fetch(`/api/balances?chainId=${chainId}&address=${address}`);
	if (!resp.ok) {
		const text = await resp.text();
		console.error('Failed to fetch balances', text);
		throw new Error('Failed to fetch balances');
	}
	return resp.json();
}
