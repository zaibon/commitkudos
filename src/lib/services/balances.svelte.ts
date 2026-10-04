import { TOKEN_DETAILS } from '@squirrel-labs/peanut-sdk';
import { ethers } from 'ethers';

import type { Balance } from '#lib/types.ts';

import { wallet } from './wallet.svelte';

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

export function isNativeToken(address?: string) {
	return (
		!address ||
		address === NATIVE_TOKEN ||
		address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
	);
}

// Multicall3 is deployed at the same address on every supported chain.
// https://github.com/mds1/multicall
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const multicallAbi = [
	'function aggregate3((address target, bool allowFailure, bytes callData)[] calls) view returns ((bool success, bytes returnData)[])'
];
interface TokenInfo {
	address: string;
	symbol: string;
	decimals: number;
}
const tokenDetails = TOKEN_DETAILS as { chainId: string; tokens: TokenInfo[] }[];

const erc20 = new ethers.utils.Interface(['function balanceOf(address) view returns (uint256)']);

/**
 * Reads the native balance and the balances of the well known tokens listed by the Peanut SDK
 * directly from the chain. Only non-empty balances are returned.
 */
async function fetchBalances(
	provider: ethers.providers.Provider,
	chainId: number,
	address: string
): Promise<Balance[]> {
	const tokens = tokenDetails.find((c) => c.chainId === chainId.toString())?.tokens ?? [];
	const native = tokens.find((t) => isNativeToken(t.address));
	const erc20Tokens = tokens.filter((t) => !isNativeToken(t.address));

	const nativeBalance = await provider.getBalance(address);
	const balances: Balance[] = [
		{
			chainId: chainId.toString(),
			address: NATIVE_TOKEN,
			symbol: native?.symbol ?? wallet.chain?.nativeCurrency.symbol ?? 'ETH',
			decimals: native?.decimals ?? 18,
			amount: parseFloat(ethers.utils.formatUnits(nativeBalance, native?.decimals ?? 18))
		}
	];

	if (erc20Tokens.length > 0) {
		const multicall = new ethers.Contract(MULTICALL3, multicallAbi, provider);
		const calldata = erc20.encodeFunctionData('balanceOf', [address]);
		const results: { success: boolean; returnData: string }[] = await multicall.aggregate3(
			erc20Tokens.map((t) => ({ target: t.address, allowFailure: true, callData: calldata }))
		);
		results.forEach((r, i) => {
			if (!r.success || r.returnData === '0x') return;
			const raw = ethers.BigNumber.from(r.returnData);
			if (raw.isZero()) return;
			const token = erc20Tokens[i];
			balances.push({
				chainId: chainId.toString(),
				address: token.address,
				symbol: token.symbol,
				decimals: token.decimals,
				amount: parseFloat(ethers.utils.formatUnits(raw, token.decimals))
			});
		});
	}

	return balances.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

class Balances {
	list = $state.raw<Balance[]>([]);
	loading = $state(false);
}

export const balances = new Balances();

$effect.root(() => {
	$effect(() => {
		const { provider, chainId, address } = wallet;
		if (!provider || !chainId || !address) {
			balances.list = [];
			return;
		}

		let cancelled = false;
		balances.loading = true;
		fetchBalances(provider, chainId, address)
			.then((list) => {
				if (!cancelled) balances.list = list;
			})
			.catch((err) => {
				console.error('Failed to fetch balances', err);
				if (!cancelled) balances.list = [];
			})
			.finally(() => {
				if (!cancelled) balances.loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
});
