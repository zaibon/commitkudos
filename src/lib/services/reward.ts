import type { ethers } from 'ethers';

import { CLAIM_PATH } from '#lib/claim.ts';
import type { Balance, Email } from '#lib/types.ts';

import { createLinks } from './peanut';

export interface Recipient {
	name: string;
	email: string;
}

/**
 * Creates one Peanut link per contributor. Does not send any email.
 */
export async function createRewardLinks(params: {
	signer: ethers.Signer;
	chainId: number;
	rewardAmount: number;
	selectedToken: Balance;
	contributors: Recipient[];
}): Promise<string[]> {
	if (
		!params.signer ||
		!params.chainId ||
		!params.rewardAmount ||
		!params.selectedToken ||
		params.contributors.length === 0
	) {
		return [];
	}

	return createLinks({
		signer: params.signer,
		chainId: params.chainId,
		amount: params.rewardAmount,
		numberOfLinks: params.contributors.length,
		token: params.selectedToken,
		baseUrl: new URL(CLAIM_PATH, window.location.origin).href
	});
}

/**
 * Emails each contributor the link at the same index.
 */
export async function sendRewardEmails(
	contributors: Recipient[],
	links: string[],
	repository: string
) {
	await Promise.all(
		links.map((link, i) =>
			sendEmail({
				name: contributors[i].name,
				email: contributors[i].email,
				repoName: repository,
				message: 'Thanks for your contribution!',
				link: link
			})
		)
	);
}

/**
 * Creates the links and emails them to the contributors.
 */
export async function sendReward(params: {
	signer: ethers.Signer;
	chainId: number;
	rewardAmount: number;
	selectedToken: Balance;
	contributors: Recipient[];
	repository: string;
}): Promise<string[]> {
	const links = await createRewardLinks(params);
	await sendRewardEmails(params.contributors, links, params.repository);
	return links;
}

async function sendEmail(email: Email) {
	const resp = await fetch(`/api/mail`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(email)
	});
	if (!resp.ok) {
		throw new Error(`failed to send email to ${email.email}: ${await resp.text()}`);
	}
}
