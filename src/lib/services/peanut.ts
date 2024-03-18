import { peanut } from '@squirrel-labs/peanut-sdk';
import { ethers } from 'ethers';

import type { Balance } from '$lib/types';

peanut.CHAIN_DETAILS;

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

	const createdLinks = await peanut.createLinks({
		structSigner: {
			signer: params.signer
		},
		linkDetails,
		numberOfLinks: params.numberOfLinks
	});

	return createdLinks.map((link) => link.link);
}
