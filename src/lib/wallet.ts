import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5';
import type { Web3Modal } from '@web3modal/ethers5/dist/types/src/client';
import type { ethers } from 'ethers';
import { writable } from 'svelte/store';

import { networks } from './networks';

let modal: Web3Modal | null = null;

export interface OpenOptions {
	view: 'Account' | 'Connect' | 'Networks';
}

export function initWeb3Modal() {
	const projectId = 'f71066d156ed5402df3e3e516de81a96';

	const metadata = {
		name: 'My Website',
		description: 'My Website description',
		url: 'https://mywebsite.com',
		icons: ['https://avatars.mywebsite.com/']
	};

	modal = createWeb3Modal({
		ethersConfig: defaultConfig({ metadata }),
		chains: [networks.gnosisTestnet, networks.sepolia],
		projectId
	});
}

export function useWeb3Modal() {
	if (!modal) {
		throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" hook');
	}

	async function open(options?: OpenOptions) {
		await modal?.open(options);
	}

	async function close() {
		await modal?.close();
	}

	return { open, close };
}

export function useWeb3ModalState() {
	if (!modal) {
		throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalState" hook');
	}

	const state = modal.getState();
	const stores = {
		selectedNetworkId: writable<number | undefined>(state.selectedNetworkId),
		isOpen: writable<boolean>(state.open)
	};

	//TODO: unsubscribe
	modal?.subscribeState((newState) => {
		stores.selectedNetworkId.set(newState.selectedNetworkId);
		stores.isOpen.set(newState.open);
	});

	return stores;
}

export function useWeb3ModalAccount() {
	const stores = {
		provider: writable<ethers.providers.Web3Provider | undefined>(undefined),
		providerType: writable<'walletConnect' | 'injected' | 'coinbaseWallet' | 'eip6963' | undefined>(
			undefined
		),
		address: writable<string | undefined>(undefined),
		chainId: writable<number | undefined>(undefined),
		isConnected: writable<boolean>(false)
	};

	//TODO: unsubribe
	modal?.subscribeProvider((newState) => {
		stores.provider.set(newState.provider);
		stores.providerType.set(newState.providerType);
		stores.address.set(newState.address);
		stores.chainId.set(newState.chainId);
		stores.isConnected.set(newState.isConnected);
	});

	function getSigner(): ethers.providers.JsonRpcSigner | undefined {
		if (modal) {
			return modal.getSigner();
		}
	}

	return { ...stores, getSigner };
}
