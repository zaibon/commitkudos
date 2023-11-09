import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5';
import type { Web3Modal } from '@web3modal/ethers5/dist/types/src/client';
import type { ethers } from 'ethers';
import { writable } from 'svelte/store';

import { chains } from '$lib/consts/chains';

export interface OpenOptions {
	view: 'Account' | 'Connect' | 'Networks';
}

let modal: Web3Modal | null = null;

export const getAccountStores = () => accountStores;

export const accountStores = {
	provider: writable<ethers.providers.Web3Provider | undefined>(undefined),
	providerType: writable<'walletConnect' | 'injected' | 'coinbaseWallet' | 'eip6963' | undefined>(
		undefined
	),
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
		chains: chains.map((chain) => {
			return {
				rpcUrl: chain.rpcUrls.public.http.toString(),
				explorerUrl: chain.blockExplorers.default.url.toString(),
				currency: chain.nativeCurrency.symbol.toString(),
				name: chain.name.toString(),
				chainId: chain.id
			};
		}),
		projectId
	});

	//TODO: unsubribe
	modal?.subscribeProvider((newState) => {
		accountStores.provider.set(newState.provider);
		accountStores.providerType.set(newState.providerType);
		accountStores.address.set(newState.address);
		accountStores.chainId.set(newState.chainId);
		accountStores.isConnected.set(newState.isConnected);
	});

	//TODO: unsubribe
	modal?.subscribeState((newState) => {
		modalSateStores.selectedNetworkId.set(newState.selectedNetworkId);
		modalSateStores.isOpen.set(newState.open);
	});
}

function getSigner(): ethers.providers.JsonRpcSigner | undefined {
	if (modal) {
		return modal.getSigner();
	}
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
