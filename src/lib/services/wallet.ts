import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5';
import { ethers } from 'ethers';
import { derived, type Readable, readable } from 'svelte/store';
import {
	arbitrum,
	avalanche,
	base,
	bsc,
	gnosis,
	goerli,
	linea,
	mainnet,
	moonbeam,
	optimism,
	polygon,
	polygonMumbai,
	polygonZkEvm
} from 'viem/chains';
import { type Chain } from 'viem/chains';

const chains = [
	mainnet,
	moonbeam,
	goerli,
	optimism,
	bsc,
	gnosis,
	polygon,
	base,
	arbitrum,
	avalanche,
	linea,
	polygonMumbai,
	polygonZkEvm
];

function toEthChain(chain: Chain) {
	return {
		rpcUrl: chain.rpcUrls.default.http[0],
		explorerUrl: chain.blockExplorers?.default.url ?? '', //FIXME
		currency: chain.nativeCurrency.symbol,
		name: chain.name,
		chainId: chain.id
	};
}

export interface OpenOptions {
	view: 'Account' | 'Connect' | 'Networks';
}

const projectId = 'f71066d156ed5402df3e3e516de81a96';
const metadata = {
	name: 'CommitKudos',
	description: `Empowering Open-Source Collaboration with Web3 Rewards, CommitKudos is a designed to celebrate and support the open-source community.`,
	url: 'https://commitkudos.com',
	icons: ['https://commitkudos.com/favicon-32x32.png']
};

const ethersConfig = defaultConfig({
	enableEIP6963: true,
	enableInjected: false,
	enableCoinbase: false,
	metadata
});

export const modal = createWeb3Modal({
	ethersConfig,
	chains: chains.map(toEthChain),
	projectId
});

export const chainId = readable<number | undefined>(modal.getChainId(), (set) =>
	modal.subscribeState((state) => {
		if (state.selectedNetworkId) {
			set(state.selectedNetworkId);
		} else {
			set(undefined);
		}
	})
);
export const provider = readable<ethers.providers.Web3Provider | undefined>(undefined, (set) =>
	modal.subscribeProvider((state) => {
		if (state.provider) {
			const ethersProvider = new ethers.providers.Web3Provider(state.provider);
			set(ethersProvider);
		} else {
			set(undefined);
		}
	})
);
export const isConnected = readable(modal.getIsConnected(), (set) =>
	modal.subscribeProvider((state) => {
		set(state.isConnected);
	})
);
export const address = readable<string | undefined>(modal.getAddress(), (set) =>
	modal.subscribeProvider((state) => {
		if (state.address) {
			set(state.address);
		} else {
			set(undefined);
		}
	})
);

export const chainInfo = derived(
	chainId,
	($chainId) => {
		if (!$chainId) {
			return undefined;
		}
		return chains.find((chain) => chain.id === $chainId);
	},
	undefined
);

export const signer = derived(provider, ($provider, set) => {
	if ($provider) {
		set($provider.getSigner());
	}
}) as Readable<ethers.Signer | undefined>;
