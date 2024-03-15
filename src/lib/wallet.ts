import { CHAIN_DETAILS } from '@squirrel-labs/peanut-sdk';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5';
import { ethers } from 'ethers';
import { writable } from 'svelte/store';

import type { PeanutChain } from './types';

type Web3Modal = ReturnType<typeof createWeb3Modal>;
export interface OpenOptions {
	view: 'Account' | 'Connect' | 'Networks';
}

let modal: Web3Modal | null = null;

export const getAccountStores = () => accountStores;

export const accountStores = {
	address: writable<string | undefined>(undefined),
	chainId: writable<number | undefined>(undefined),
	isConnected: writable<boolean>(false),
	getSigner
};

export const modalSateStores = {
	selectedNetworkId: writable<number | undefined>(undefined),
	isOpen: writable<boolean>(false)
};

export function initWeb3Modal() {
	const projectId = 'f71066d156ed5402df3e3e516de81a96';

	const metadata = {
		name: 'CommitKudos',
		description: `Empowering Open-Source Collaboration with Web3 Rewards, CommitKudos is a designed to celebrate and support the open-source community.`,
		url: 'https://commitkudos.com',
		icons: ['https://commitkudos.com/favicon-32x32.png']
	};

	modal = createWeb3Modal({
		ethersConfig: defaultConfig({ metadata }),
		chains: (Object.values(CHAIN_DETAILS) as PeanutChain[]).map((chain: PeanutChain) => {
			return {
				rpcUrl: chain.rpc[0],
				explorerUrl: chain.explorers[0].url,
				currency: chain.nativeCurrency.symbol.toString(),
				name: chain.name,
				chainId: chain.chainId
			};
		}),
		projectId
	});

	//TODO: unsubscribe
	modal?.subscribeProvider((newState) => {
		accountStores.address.set(newState.address);
		accountStores.chainId.set(newState.chainId);
		accountStores.isConnected.set(newState.isConnected);
	});

	//TODO: unsubscribe
	modal?.subscribeState((newState) => {
		modalSateStores.selectedNetworkId.set(newState.selectedNetworkId);
		modalSateStores.isOpen.set(newState.open);
	});
}

function getSigner(): ethers.providers.JsonRpcSigner | undefined {
	if (!modal) return undefined;
	const provider = modal.getWalletProvider();

	if (!provider) return undefined;

	const p = new ethers.providers.Web3Provider(provider);
	return p.getSigner();
}

export async function open(options?: OpenOptions) {
	if (!modal) {
		throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" hook');
	}
	await modal?.open(options);
}

export async function close() {
	if (!modal) {
		throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" hook');
	}
	await modal?.close();
}
