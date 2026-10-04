import { peanut } from '@squirrel-labs/peanut-sdk';
import type { ethers } from 'ethers';

import type { Balance } from '#lib/types.ts';

import { isNativeToken } from './balances.svelte';
import { publicProvider } from './wallet.svelte';

peanut.toggleVerbose(import.meta.env.DEV);

export async function createLinks(params: {
	signer: ethers.Signer;
	chainId: number;
	amount: number;
	numberOfLinks: number;
	token: Balance;
	/** URL of the claim page the links point to */
	baseUrl: string;
}): Promise<string[]> {
	// Values for tokenType are defined in SDK documentation:
	// https://docs.peanut.to/integrations/building-with-the-sdk/sdk-reference/common-types#epeanutlinktype
	// 0 for ether, 1 for erc20
	const tokenType = isNativeToken(params.token.address) ? 0 : 1;

	const linkDetails = {
		chainId: params.chainId.toString(),
		tokenAmount: params.amount,
		tokenType: tokenType,
		tokenAddress: tokenType == 1 ? params.token.address : undefined,
		tokenDecimals: params.token.decimals,
		baseUrl: params.baseUrl
	};

	const passwords: string[] = [];
	for (let i = 0; i < params.numberOfLinks; i++) {
		passwords.push(await peanut.getRandomString(16));
	}
	const provider = params.signer.provider;
	const address = await params.signer.getAddress();
	const preparedTransactions = await peanut.prepareDepositTxs({
		address: address,
		linkDetails,
		passwords: passwords,
		numberOfLinks: params.numberOfLinks,
		provider
	});

	let lastTxHash = '';
	// transactions must be mined in order: an ERC20 approval has to land before the deposit
	for (const unsignedTx of preparedTransactions.unsignedTxs) {
		const convertedTx = peanut.peanutToEthersV5Tx(unsignedTx);
		const tx = await params.signer.sendTransaction(convertedTx);
		await tx.wait();
		lastTxHash = tx.hash;
	}

	const { links } = await peanut.getLinksFromTx({
		linkDetails,
		passwords: passwords,
		txHash: lastTxHash,
		provider
	});
	return links;
}

export interface LinkParams {
	chainId: number;
	contractVersion: string;
	depositIdx: number;
	password: string;
}

/**
 * Reads the deposit parameters of a reward link. Accepts links to our claim page as well as
 * links generated for peanut.to (`?c=…&v=…&i=…#p=…` or the older `#?c=…&p=…` form).
 */
export function parseLink(link: string): LinkParams | undefined {
	try {
		const p = peanut.getParamsFromLink(link);
		const chainId = Number(p.chainId);
		if (!chainId || !p.contractVersion || !p.password || !Number.isInteger(p.depositIdx)) return;
		return {
			chainId,
			contractVersion: p.contractVersion,
			depositIdx: p.depositIdx,
			password: p.password
		};
	} catch {
		return;
	}
}

/** Rewrites any reward link so it opens on our claim page. */
export function toClaimUrl(link: string, baseUrl: string): string | undefined {
	const p = parseLink(link);
	if (!p) return;
	return peanut.getLinkFromParams(
		p.chainId.toString(),
		p.contractVersion,
		p.depositIdx,
		p.password,
		baseUrl
	);
}

export interface LinkDetails {
	chainId: number;
	tokenSymbol: string;
	tokenAmount: string;
	tokenAddress: string;
	senderAddress: string;
	claimed: boolean;
	depositDate: Date;
}

/** Reads what a link holds directly from the chain, no wallet needed. */
export async function getLinkDetails(link: string): Promise<LinkDetails> {
	const params = parseLink(link);
	if (!params) throw new Error('invalid reward link');
	const d = await peanut.getLinkDetails({ link, provider: publicProvider(params.chainId) });
	return {
		chainId: params.chainId,
		tokenSymbol: d.tokenSymbol,
		tokenAmount: d.tokenAmount,
		tokenAddress: d.tokenAddress,
		senderAddress: d.senderAddress,
		claimed: d.claimed,
		depositDate: d.depositDate
	};
}

/**
 * Claims a link to `recipient`. The signer pays the gas and must be connected to the link's chain:
 * Peanut's gasless relayer (api.peanut.to) has been shut down.
 */
export async function claimLink(params: {
	signer: ethers.Signer;
	link: string;
	recipient: string;
}): Promise<string> {
	const linkParams = parseLink(params.link);
	if (!linkParams) throw new Error('invalid reward link');

	const unsignedTx = await peanut.prepareClaimTx({
		link: params.link,
		recipientAddress: params.recipient,
		provider: publicProvider(linkParams.chainId)
	});
	const tx = await params.signer.sendTransaction(peanut.peanutToEthersV5Tx(unsignedTx));
	await tx.wait();
	return tx.hash;
}
