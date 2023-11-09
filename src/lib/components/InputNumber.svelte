<script lang="ts">
	export let value: number | undefined;
	export let placeholder: string | null | undefined;
	export let min: string | number | null | undefined = undefined;
	export let max: string | number | null | undefined = undefined;

	function increment() {
		if (!value) {
			value = 0;
		}
		value += 1;
	}
	function decrement() {
		if (!value) {
			value = 0;
		}
		value -= 1;
	}
</script>

<div class="flex flex-row gap-x-1">
	<input
		bind:value
		class="input w-1/2"
		autocomplete="off"
		type="number"
		inputmode="decimal"
		step="any"
		{min}
		{max}
		{placeholder}
	/>
	<div class="flex flex-row w-full gap-1">
		<button on:click={increment} class="button w-1/2 input !bg-primary-500">+</button>
		<button on:click={decrement} class="button input w-1/2 !bg-secondary-500">-</button>
	</div>
</div>

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
		/* Firefox */
	}
</style>
