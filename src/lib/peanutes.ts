import { peanut } from '@squirrel-labs/peanut-sdk';
import type { ethers } from 'ethers';

export async function createLinks(
	wallet: ethers.Signer,
	chainId: number,
	amount: number,
	numberOfLinks: number = 1,
	tokenAddress?: string
) {
	// 1 for ERC20 tokens 0 for native tokens
	const tokenType =
		tokenAddress && tokenAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? 1 : 0;

	const links = await peanut.createLinks({
		structSigner: {
			signer: wallet
		},
		linkDetails: {
			chainId: chainId.toString(),
			tokenAmount: amount,
			tokenType: tokenType,
			tokenAddress: tokenAddress
			// Values for tokenType are defined in SDK documentation:
			// https://docs.peanut.to/integrations/building-with-the-sdk/sdk-reference/common-types#epeanutlinktype
		},
		numberOfLinks: numberOfLinks
	});
	return links;
}
