import { peanut } from '@squirrel-labs/peanut-sdk';
import type { ethers } from 'ethers';

import type { Balance } from '#lib/types.ts';

import { isNativeToken } from './balances.svelte';

peanut.toggleVerbose(import.meta.env.DEV);

export async function createLinks(params: {
	signer: ethers.Signer;
	chainId: number;
	amount: number;
	numberOfLinks: number;
	token: Balance;
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
		tokenDecimals: params.token.decimals
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
