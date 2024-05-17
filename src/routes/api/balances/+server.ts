// import { AnkrProvider, type Balance as BalanceAnkr, type Blockchain } from '@ankr.com/ankr.js';
import { calculatePrettyBalance, type ChainID, CovalentClient } from '@covalenthq/client-sdk';
import { error, json } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';
import type { Balance } from '$lib/types';

import type { RequestHandler } from './$types';

// const ankr = new AnkrProvider(env.ANKR_PROVIDER ?? '');
const client = new CovalentClient(env.COVALENT_API_KEY, {
	enableRetry: true,
	threadCount: 10,
	debug: true
});

// const _chainMapping: Record<number, Blockchain> = {
// 	1: 'eth',
// 	5: 'eth_goerli',
// 	10: 'optimism',
// 	14: 'flare',
// 	42_161: 'arbitrum',
// 	43_113: 'avalanche_fuji',
// 	43_114: 'avalanche',
// 	56: 'bsc',
// 	57: 'syscoin',
// 	250: 'fantom',
// 	137: 'polygon',
// 	570: 'rollux',
// 	534_352: 'scroll',
// 	8453: 'base',
// 	59_144: 'linea',
// 	80_001: 'polygon_mumbai',
// 	100: 'gnosis',
// 	1101: 'polygon_zkevm'
// };

export const GET: RequestHandler = async ({ url }) => {
	const chainIdStr = url.searchParams.get('chainId') ?? '';
	const address = url.searchParams.get('address') ?? '';

	if (!chainIdStr || !address) {
		error(400, 'Missing chainId or address');
	}

	// const b = await ankrListToken(chainIdStr, address);
	const chainId = parseInt(chainIdStr) as ChainID;
	const b = await covalentListTokens(chainId, address);

	return json(b);
};

// async function ankrListToken(chainIdStr: string, address: string): Promise<Balance[]> {
// 	const chainId = parseInt(chainIdStr);
// 	const blockchain = _chainMapping[chainId];

// 	const assets: BalanceAnkr[] = [];
// 	let result = await ankr.getAccountBalance({
// 		blockchain: blockchain,
// 		walletAddress: address
// 	});
// 	assets.push(...result.assets);

// 	while (result.nextPageToken) {
// 		result = await ankr.getAccountBalance({
// 			blockchain: blockchain,
// 			walletAddress: address,
// 			pageToken: result.nextPageToken
// 		});
// 		assets.push(...result.assets);
// 	}

// 	const b = result.assets.map((b) => {
// 		return {
// 			chainId: chainId.toString(),
// 			decimals: b.tokenDecimals,
// 			symbol: b.tokenSymbol,
// 			amount: parseFloat(b.balance),
// 			address: b.contractAddress ?? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
// 		} as Balance;
// 	});

// 	return b
// }

async function covalentListTokens(chainId: ChainID, address: string): Promise<Balance[]> {
	const resp = await client.BalanceService.getTokenBalancesForWalletAddress(chainId, address, {
		noSpam: true
	});
	if (resp.error) {
		throw Error(resp.error_message);
	}

	const balances = resp.data.items
		.filter((token) => token.type === 'cryptocurrency')
		.map((token) => {
			return {
				decimals: token.contract_decimals,
				symbol: token.contract_ticker_symbol,
				image: token.logo_url,
				amount: parseFloat(
					calculatePrettyBalance(token.balance ?? 0, token.contract_decimals, true, 4)
				),
				address: token.contract_address,
				chainId: resp.data.chain_id.toString()
			};
		})
		.filter((b) => b.amount > 0);
	return balances;
}
