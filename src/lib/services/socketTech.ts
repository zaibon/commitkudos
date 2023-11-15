import * as socketTech from '@socket.tech/socket-v2-sdk';
import { derived, type Readable } from 'svelte/store';

import { getAccountStores } from './wallet';

const { chainId, address } = getAccountStores();

export const socket = new socketTech.Socket({
	apiKey: '72a5b4b0-e727-48be-8aa1-5da9d62fe635', //process.env.SOCKET_API_KEY ?? '72a5b4b0-e727-48be-8aa1-5da9d62fe635',
	defaultQuotePreferences: {
		singleTxOnly: true
	}
});

export const balances = derived(
	[address, chainId],
	([$address, $chainId], set) => {
		if ($address && $chainId) {
			getUserBalances($address).then((balances) => {
				const filteredBalances = balances.filter(
					(balance) => balance.amount > 0 && balance.chainId == $chainId
				);
				if (filteredBalances.length > 0) {
					set(filteredBalances);
				} else {
					set([]);
				}
			});
		}
	},
	[] as socketTech.BalanceResult[]
) as Readable<socketTech.BalanceResult[]>;

async function getUserBalances(address?: string) {
	if (!address) {
		return [];
	}

	const resp = await socket.getBalances({ userAddress: address });
	if (resp.success) {
		return resp.result;
	}
	return [];
}
