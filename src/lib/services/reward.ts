import type { ethers } from 'ethers';

import { createLinks } from './peanut';
import type { Email } from '$lib/types';

export async function sendReward(params: {
	signer: ethers.Signer;
	chainId: number;
	rewardAmount: number;
	selectedToken: { name: string; address: string };
	selected: { name: string; email: string }[];
	repository: string;
}) {
	if (
		!params.signer ||
		!params.chainId ||
		!params.rewardAmount ||
		!params.selectedToken ||
		params.selected.length === 0
	) {
		return;
	}

	const links = await createLinks({
		wallet: params.signer,
		chainId: params.chainId,
		amount: params.rewardAmount,
		numberOfLinks: params.selected.length,
		tokenAddress: params.selectedToken.address
	});

	Promise.all(
		links.map(async (link, i) => {
			await sendEmail({
				name: params.selected[i].name,
				email: params.selected[i].email,
				repoName: params.repository,
				message: 'Thanks for your contribution!',
				link: link.link
			});
		})
	);
}

async function sendEmail(email: Email) {
	console.log('send email:', { ...email });
	return fetch(`/api/mail`, {
		method: 'POST',
		body: JSON.stringify(email)
	});
}
