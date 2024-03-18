import { peanut } from '@squirrel-labs/peanut-sdk';
import { ethers } from 'ethers';

import type { Balance } from '$lib/types';

peanut.toggleVerbose(true);

export async function createLinks(params: {
	signer: ethers.Signer;
	chainId: number;
	amount: number;
	numberOfLinks: number;
	token: Balance;
}) {
	// Values for tokenType are defined in SDK documentation:
	// https://docs.peanut.to/integrations/building-with-the-sdk/sdk-reference/common-types#epeanutlinktype
	// 0 for ether, 1 for erc20
	const tokenType =
		params.token.address && params.token.address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
			? 1
			: 0;

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
	const address = await params.signer.getAddress();
	const preparedTransactions = await peanut.prepareDepositTxs({
		address: address,
		linkDetails,
		passwords: passwords,
		numberOfLinks: params.numberOfLinks
	});

	const transactionHashes: string[] = [];

	for (const unsignedTx of preparedTransactions.unsignedTxs) {
		const convertedTx = peanut.peanutToEthersV5Tx(unsignedTx);
		const signedTx = await params.signer.sendTransaction(convertedTx);

		transactionHashes.push(signedTx.hash);
	}

	const { links } = await peanut.getLinksFromTx({
		linkDetails,
		passwords: passwords,
		txHash: transactionHashes[transactionHashes.length - 1]
	});
	return links;
}
