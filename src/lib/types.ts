export interface CommitDetail {
	sha: string;
	node_id: string;
	commit: Commit;
	url: string;
	html_url: string;
	comments_url: string;
	author: User;
	committer: User;
	parents: Parent[];
}

export interface Commit {
	author: Author;
	committer: Committer;
	message: string;
	tree: Tree;
	url: string;
	comment_count: number;
	verification: Verification;
}

export interface Author {
	name: string;
	email: string;
	date: string;
}

export interface Committer {
	name: string;
	email: string;
	date: string;
}

export interface Tree {
	sha: string;
	url: string;
}

export interface Verification {
	verified: boolean;
	reason: string;
	signature: string;
	payload: string;
}

export interface User {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

export interface Contributor {
	login: string;
	name: string;
	avatarUrl: string;
	email: string;
	twitter?: string;
	discord?: string;
	checked: boolean;
	numberOfContributions: number;
}

export interface Parent {
	sha: string;
	url: string;
	html_url: string;
}

export interface Email {
	name: string;
	email: string;
	repoName: string;
	message: string;
	link: string;
}

export interface PeanutChain {
	name: string;
	chain: string;
	icon: Icon;
	rpc: string[];
	features: Feature[];
	faucets: string[];
	nativeCurrency: NativeCurrency;
	infoURL: string;
	shortName: string;
	chainId: number;
	networkId: number;
	slip44: number;
	ens: Ens;
	explorers: Explorer[];
	mainnet: boolean;
}

export interface Icon {
	url: string;
	format: string;
}

export interface Feature {
	name: string;
}

export interface NativeCurrency {
	name: string;
	symbol: string;
	decimals: number;
}

export interface Ens {
	registry: string;
}

export interface Explorer {
	name: string;
	url: string;
	standard: string;
	icon?: string;
}

export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';

export interface Badge {
	badgeContent: string;
	style?: BadgeStyle;
	logo?: string;
	logoColor?: string;
	label?: string;
	labelColor?: string;
	color?: string;
	cacheSeconds?: number;
	link?: string;
}
export interface RewardAmount {
	contributor: Contributor;
	amount: number;
	token: Balance;
}

export interface Balance {
	decimals: number;
	symbol: string;
	amount: number;
	address: string;
	chainId: string;
}
