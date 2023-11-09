export function shortenWalletAddress(addr: string): string {
	if (addr.length < 6) {
		return addr;
	}
	return addr?.slice(0, 4) + '...' + addr?.slice(-6);
}
