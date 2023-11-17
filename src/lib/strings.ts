export function shortAddress(address?: string) {
	if (address) {
		return address.slice(0, 6) + '...' + address.slice(-4);
	}
	return '';
}
