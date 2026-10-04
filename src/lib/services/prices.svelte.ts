import { TOKEN_DETAILS } from '@squirrel-labs/peanut-sdk';

import type { Balance } from '#lib/types.ts';

import { isNativeToken } from './balances.svelte.ts';
import { wallet } from './wallet.svelte.ts';

// DefiLlama's coins API is free, needs no API key, sends `Access-Control-Allow-Origin: *` and
// accepts many coins per request. CoinGecko's keyless API only allows one contract address per
// request, which doesn't scale to a whole token list.
// https://defillama.com/docs/api
const PRICES_API = 'https://coins.llama.fi/prices/current/';
export const PRICE_SOURCE = 'DefiLlama';
export const PRICE_TTL = 5 * 60 * 1000;

// DefiLlama quotes prices in USD. EURC (Circle's euro stablecoin) is used as the USD → EUR rate,
// which is close enough for an approximate value and keeps everything in a single request.
const EUR_COIN = 'coingecko:euro-coin';
// Ignore prices DefiLlama itself isn't confident about (illiquid tokens).
const MIN_CONFIDENCE = 0.9;

// DefiLlama chain slug and native coin per chain. Testnets are left out on purpose.
const chains: Record<string, { slug: string; native: string }> = {
	'1': { slug: 'ethereum', native: 'coingecko:ethereum' },
	'10': { slug: 'optimism', native: 'coingecko:ethereum' },
	'56': { slug: 'bsc', native: 'coingecko:binancecoin' },
	'100': { slug: 'xdai', native: 'coingecko:xdai' },
	'137': { slug: 'polygon', native: 'coingecko:polygon-ecosystem-token' },
	'8453': { slug: 'base', native: 'coingecko:ethereum' },
	'42161': { slug: 'arbitrum', native: 'coingecko:ethereum' },
	'43114': { slug: 'avax', native: 'coingecko:avalanche-2' },
	'59144': { slug: 'linea', native: 'coingecko:ethereum' }
};

const tokenDetails = TOKEN_DETAILS as { chainId: string; tokens: { address: string }[] }[];

type EurPrices = Record<string, number>;

const priceKey = (address: string) => (isNativeToken(address) ? 'native' : address.toLowerCase());

/**
 * Fetches the EUR price of the native coin and of every token the Peanut SDK lists for a chain,
 * in a single request. Tokens without a (confident) price are left out.
 */
export async function fetchEurPrices(chainId: string): Promise<EurPrices> {
	const chain = chains[chainId];
	if (!chain) return {};

	const tokens = tokenDetails.find((c) => c.chainId === chainId)?.tokens ?? [];
	// price key -> DefiLlama coin id
	const coins: Record<string, string> = { native: chain.native };
	for (const t of tokens) {
		if (!isNativeToken(t.address))
			coins[priceKey(t.address)] = `${chain.slug}:${priceKey(t.address)}`;
	}

	const ids = [EUR_COIN, ...Object.values(coins)];
	const res = await fetch(PRICES_API + ids.join(','));
	if (!res.ok) throw new Error(`price request failed: ${res.status}`);
	const { coins: quotes }: { coins: Record<string, { price: number; confidence?: number }> } =
		await res.json();

	const usdPrice = (id: string) => {
		const quote = quotes[id];
		if (!quote || !(quote.price > 0) || (quote.confidence ?? 1) < MIN_CONFIDENCE) return;
		return quote.price;
	};
	const eurUsd = usdPrice(EUR_COIN);
	if (!eurUsd) throw new Error('missing EUR rate');

	const prices: EurPrices = {};
	for (const [key, id] of Object.entries(coins)) {
		const usd = usdPrice(id);
		if (usd) prices[key] = usd / eurUsd;
	}
	return prices;
}

class Prices {
	byChain = $state.raw<Record<string, { fetchedAt: number; eur: EurPrices }>>({});

	/** Approximate EUR price of one unit of `token`, if known. */
	eur(token?: Balance): number | undefined {
		if (!token) return;
		return this.byChain[token.chainId]?.eur[priceKey(token.address)];
	}
}

export const prices = new Prices();

const inFlight: Record<string, boolean> = {};

async function loadPrices(chainId: string) {
	const cached = prices.byChain[chainId];
	if (!chains[chainId] || inFlight[chainId]) return;
	if (cached && Date.now() - cached.fetchedAt < PRICE_TTL) return;

	inFlight[chainId] = true;
	try {
		const eur = await fetchEurPrices(chainId);
		prices.byChain = { ...prices.byChain, [chainId]: { fetchedAt: Date.now(), eur } };
	} catch (err) {
		// keep recent prices and try again at the next refresh, but don't show outdated ones
		console.warn('Failed to fetch token prices', err);
		if (cached && Date.now() - cached.fetchedAt > 3 * PRICE_TTL) {
			const rest = { ...prices.byChain };
			delete rest[chainId];
			prices.byChain = rest;
		}
	} finally {
		delete inFlight[chainId];
	}
}

// One shared refresh loop for the connected chain, no matter how many inputs display prices.
$effect.root(() => {
	$effect(() => {
		// AppKit reports a default network even without a wallet, so wait for a connection
		const chainId = wallet.isConnected ? wallet.chainId?.toString() : undefined;
		if (!chainId || !chains[chainId]) return;

		loadPrices(chainId);
		const timer = setInterval(() => loadPrices(chainId), PRICE_TTL);
		return () => clearInterval(timer);
	});
});
