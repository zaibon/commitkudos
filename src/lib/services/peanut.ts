import { peanut } from '@squirrel-labs/peanut-sdk';
import type { ethers } from 'ethers';

export async function createLinks(params: {
	wallet: ethers.Signer;
	chainId: number;
	amount: number;
	numberOfLinks: number;
	tokenAddress?: string;
}) {
	// 1 for ERC20 tokens 0 for native tokens
	const tokenType =
		params.tokenAddress && params.tokenAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
			? 1
			: 0;

	const links = await peanut.createLinks({
		structSigner: {
			signer: params.wallet
		},
		linkDetails: {
			chainId: params.chainId,
			tokenAmount: params.amount,
			tokenType: tokenType,
			tokenAddress: params.tokenAddress
			// Values for tokenType are defined in SDK documentation:
			// https://docs.peanut.to/integrations/building-with-the-sdk/sdk-reference/common-types#epeanutlinktype
		},
		numberOfLinks: params.numberOfLinks
	});
	return links;
}
