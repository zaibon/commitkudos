import peanut from '@squirrel-labs/peanut-sdk';

export async function createLinks(
	wallet,
	chainId: number,
	amount: number,
	numberOfLinks: number = 1,
	tokenType = 0
) {
	const links = await peanut.createLinks({
		structSigner: {
			signer: wallet
		},
		linkDetails: {
			chainId: chainId,
			tokenAmount: amount,
			tokenType: 0 // 0 is for native tokens
			// Values for tokenType are defined in SDK documentation:
			// https://docs.peanut.to/integrations/building-with-the-sdk/sdk-reference/common-types#epeanutlinktype
		},
		numberOfLinks: numberOfLinks
	});
	return links;
}
