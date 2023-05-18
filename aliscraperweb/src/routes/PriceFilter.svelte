<script lang="ts">
	export let minPrice: number;
	export let maxPrice: number;
	export let realMaxPrice: number;
</script>

<details
	class="overflow-hidden rounded border border-gray-300 [&_summary::-webkit-details-marker]:hidden"
>
	<summary
		class="flex cursor-pointer items-center justify-between gap-2 bg-white p-4 text-gray-900 transition"
	>
		<span class="text-sm font-medium"> Price </span>

		<span class="transition group-open:-rotate-180">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="h-4 w-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
			</svg>
		</span>
	</summary>

	<div class="border border-gray-200 bg-white absolute">
		<header class="flex items-center justify-between p-4">
			<span class="text-sm text-gray-700"> The highest price is ${realMaxPrice} </span>

			<button
				type="button"
				class="text-sm text-gray-900 underline underline-offset-4"
				on:click={() => {
					minPrice = 0;
					maxPrice = realMaxPrice;
				}}
			>
				Reset
			</button>
		</header>

		<div class="border-t border-gray-200 p-4">
			<div class="flex justify-between gap-4">
				<label for="FilterPriceFrom" class="flex items-center gap-2">
					<span class="text-sm text-gray-600">$</span>

					<input
						type="number"
						id="FilterPriceFrom"
						placeholder="From"
						class="w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
						bind:value={minPrice}
					/>
				</label>

				<label for="FilterPriceTo" class="flex items-center gap-2">
					<span class="text-sm text-gray-600">$</span>

					<input
						type="number"
						id="FilterPriceTo"
						placeholder="To"
						class="w-full rounded-md border-gray-200 shadow-sm sm:text-sm"
						bind:value={maxPrice}
					/>
				</label>
			</div>
		</div>
	</div>
</details>
