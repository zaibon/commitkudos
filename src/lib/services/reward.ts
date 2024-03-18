import type { ethers } from 'ethers';

import type { Balance, Email } from '$lib/types';

import { createLinks } from './peanut';

export async function sendReward(params: {
	signer: ethers.Signer;
	chainId: number;
	rewardAmount: number;
	selectedToken: Balance;
	contributors: { name: string; email: string }[];
	repository: string;
}) {
	if (
		!params.signer ||
		!params.chainId ||
		!params.rewardAmount ||
		!params.selectedToken ||
		params.contributors.length === 0
	) {
		return [];
	}

	const links = await createLinks({
		signer: params.signer,
		chainId: params.chainId,
		amount: params.rewardAmount,
		numberOfLinks: params.contributors.length,
		token: params.selectedToken
	});

	await Promise.all(
		links.map(async (link, i) => {
			await sendEmail({
				name: params.contributors[i].name,
				email: params.contributors[i].email,
				repoName: params.repository,
				message: 'Thanks for your contribution!',
				link: link
			});
		})
	);
	return links;
}

async function sendEmail(email: Email) {
	console.log('send email:', { ...email });
	return fetch(`/api/mail`, {
		method: 'POST',
		body: JSON.stringify(email)
	});
}
