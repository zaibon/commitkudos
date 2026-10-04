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

export type Currency = 'EUR' | 'USD';
const CURRENCY_KEY = 'currency';

interface ChainPrices {
	fetchedAt: number;
	/** USD price per price key */
	usd: Record<string, number>;
	/** USD value of one euro, missing when the EUR rate couldn't be priced */
	eurUsd?: number;
}

const priceKey = (address: string) => (isNativeToken(address) ? 'native' : address.toLowerCase());

/**
 * Fetches the USD price of the native coin and of every token the Peanut SDK lists for a chain,
 * plus the EUR rate, in a single request. Tokens without a (confident) price are left out.
 */
export async function fetchPrices(chainId: string): Promise<Omit<ChainPrices, 'fetchedAt'>> {
	const chain = chains[chainId];
	if (!chain) return { usd: {} };

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

	const usd: Record<string, number> = {};
	for (const [key, id] of Object.entries(coins)) {
		const price = usdPrice(id);
		if (price) usd[key] = price;
	}
	return { usd, eurUsd: usdPrice(EUR_COIN) };
}

function readCurrency(): Currency {
	try {
		if (localStorage.getItem(CURRENCY_KEY) === 'USD') return 'USD';
	} catch {
		// storage unavailable
	}
	return 'EUR';
}

class Prices {
	byChain = $state.raw<Record<string, ChainPrices>>({});
	#currency = $state<Currency>(readCurrency());

	get currency() {
		return this.#currency;
	}

	set currency(value: Currency) {
		this.#currency = value;
		try {
			localStorage.setItem(CURRENCY_KEY, value);
		} catch {
			// storage unavailable
		}
	}

	/** Approximate price of one unit of `token` in the selected currency, if known. */
	price(token?: Balance): number | undefined {
		if (!token) return;
		const chain = this.byChain[token.chainId];
		const usd = chain?.usd[priceKey(token.address)];
		if (usd === undefined) return;
		if (this.currency === 'USD') return usd;
		return chain.eurUsd ? usd / chain.eurUsd : undefined;
	}
}

export const prices = new Prices();

const amountFormat = new Intl.NumberFormat(undefined, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});

/** Formats a value in the selected currency, e.g. "4.62 €" or "$4.62". */
export function formatPrice(value: number, currency: Currency) {
	const small = value > 0 && value < 0.01;
	const amount = small ? '0.01' : amountFormat.format(value);
	const formatted = currency === 'USD' ? `$${amount}` : `${amount} €`;
	return small ? `< ${formatted}` : formatted;
}

const inFlight: Record<string, boolean> = {};

async function loadPrices(chainId: string) {
	const cached = prices.byChain[chainId];
	if (!chains[chainId] || inFlight[chainId]) return;
	if (cached && Date.now() - cached.fetchedAt < PRICE_TTL) return;

	inFlight[chainId] = true;
	try {
		const fetched = await fetchPrices(chainId);
		prices.byChain = { ...prices.byChain, [chainId]: { fetchedAt: Date.now(), ...fetched } };
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
