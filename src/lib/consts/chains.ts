// https://wagmi.sh/core/chains
import type { Chain } from 'wagmi';
import {
	arbitrum,
	avalanche,
	base,
	bsc,
	gnosis,
	gnosisChiado,
	goerli, // testnets
	mainnet,
	optimism,
	polygon,
	sepolia // testnets
} from 'wagmi/chains';

// TODO: replace with baseGoerli (wagmi export)
const baseTestnet = {
	id: 84531,
	name: 'Base Goerli Testnet',
	network: 'baseGoerli',
	nativeCurrency: {
		name: 'Ether',
		symbol: 'ETH',
		decimals: 18
	},
	rpcUrls: {
		public: { http: ['https://base-goerli.publicnode.com'] },
		default: { http: ['https://base-goerli.publicnode.com'] }
	},
	blockExplorers: {
		default: { name: 'Blockscout', url: 'https://goerli.basescan.org/' }
	},
	contracts: {}
} as const satisfies Chain;

export const chains = [
	mainnet,
	arbitrum,
	avalanche,
	base,
	baseTestnet,
	bsc,
	gnosis,
	gnosisChiado,
	goerli,
	optimism,
	polygon,
	sepolia
];
