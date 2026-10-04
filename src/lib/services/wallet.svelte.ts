import { createAppKit } from '@reown/appkit';
import {
	type AppKitNetwork,
	arbitrum,
	avalanche,
	base,
	bsc,
	gnosis,
	linea,
	mainnet,
	optimism,
	polygon,
	sepolia
} from '@reown/appkit/networks';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { ethers } from 'ethers';

// Only chains on which the Peanut protocol has contracts deployed.
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
	mainnet,
	optimism,
	bsc,
	gnosis,
	polygon,
	base,
	arbitrum,
	avalanche,
	linea,
	sepolia
];

const projectId = 'f71066d156ed5402df3e3e516de81a96';
const metadata = {
	name: 'CommitKudos',
	description: `Empowering Open-Source Collaboration with Web3 Rewards, CommitKudos is a designed to celebrate and support the open-source community.`,
	url: 'https://commitkudos.com',
	icons: ['https://commitkudos.com/favicon-32x32.png']
};

export const modal = createAppKit({
	adapters: [new Ethers5Adapter()],
	networks,
	projectId,
	metadata,
	features: {
		analytics: false,
		email: false,
		socials: false
	}
});

class Wallet {
	address = $state<string | undefined>();
	chainId = $state<number | undefined>();
	isConnected = $state(false);
	provider = $state.raw<ethers.providers.Web3Provider | undefined>();

	chain = $derived(networks.find((n) => n.id === this.chainId));
	signer = $derived(this.provider?.getSigner());
}

export const wallet = new Wallet();

modal.subscribeAccount((state) => {
	wallet.address = state.address;
	wallet.isConnected = state.isConnected;
});

modal.subscribeNetwork((state) => {
	wallet.chainId = state.chainId ? Number(state.chainId) : undefined;
});

modal.subscribeProviders((providers) => {
	const provider = providers.eip155 as ethers.providers.ExternalProvider | undefined;
	// 'any' lets the provider follow network changes made from the wallet
	wallet.provider = provider ? new ethers.providers.Web3Provider(provider, 'any') : undefined;
});
