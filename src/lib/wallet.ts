import type { ethers } from 'ethers';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/vue';
import { derived, writable } from 'svelte/store';
import { networks } from './networks';

export const provider = writable(undefined);
export const providerType = writable(undefined);
export const address = writable(undefined);
export const chainId = writable<number>(undefined);
export const isConnected = writable(false);
export const isOpen = writable(false);
export const networkId = writable(undefined);
export const signer = derived(isConnected, () => {
	if (!modal) {
		return {
			isReady: false,
			signer: undefined
		};
	}
	return {
		isReady: true,
		signer: modal.getSigner()
	};
});

let modal = null;

export function openWalletModal(options) {
	modal.open(options);
}

export function initStores() {
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

	modal.subscribeProvider((event) => {
		isConnected.set(event.isConnected);
		provider.set(event.provider);
		providerType.set(event.providerType);
		address.set(event.address);
		chainId.set(event.chainId);
	});
	modal.subscribeState(({ open, selectedNetworkId }) => {
		isOpen.set(open);
		networkId.set(selectedNetworkId);
	});
}
