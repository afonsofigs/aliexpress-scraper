<script lang="ts">
	import '../app.css';
	import Filter from './Filter.svelte';
	import PriceFilter from './PriceFilter.svelte';
	export let data;
	let wishlistsSelected: string[] = [];
	let minPrice = 0;

	let filteredData = data.serverData.items;

	let realMaxPrice = (() => {
		let aux = 0;
		filteredData.forEach((e) => {
			const total = parseFloat(e.TotalPrice);
			total > aux ? (aux = total) : null;
		});
		return aux;
	})();
	let maxPrice = realMaxPrice;

	$: (wishlistsSelected, minPrice, maxPrice),
		(() => {
			filteredData = (
				wishlistsSelected.length > 0
					? data.serverData.items.filter((item) => wishlistsSelected.includes(item.Wishlist))
					: data.serverData.items
			).filter(
				(item) => minPrice <= parseFloat(item.TotalPrice) && maxPrice >= parseFloat(item.TotalPrice)
			);
		})();
</script>

<div class="p-10">
	<div class="my-6 flex flex-row flex-wrap gap-3 sticky top-5">
		<Filter
			title="Wishlists"
			options={data.serverData.wishlists}
			bind:optionSelected={wishlistsSelected}
		/>
		<PriceFilter bind:minPrice bind:maxPrice bind:realMaxPrice />
	</div>

	<div class="overflow-x-auto rounded-lg border border-gray-200">
		<table class="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
			<thead class="ltr:text-left rtl:text-right">
				<tr>
					{#each ['Wishlist', 'Product', 'Image', 'Total Price'] as key}
						<th class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
							{key}
						</th>
					{/each}
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200">
				{#each filteredData as item}
					<tr class="text-center">
						<td class="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
							{item.Wishlist}
						</td>
						<td class="px-4 py-2 text-gray-700 max-w-xs"
							><a href={item.ProdURL} target="_blank">{item.ProductName}</a></td
						>
						<td class="whitespace-nowrap px-4 py-2 text-gray-700"
							><img src={item.ImageURL} alt={item.ProductName} class="m-auto" /></td
						>
						<td class="whitespace-nowrap px-4 py-2 text-gray-700">{item.TotalPrice}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
