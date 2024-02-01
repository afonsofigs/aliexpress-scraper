<script lang="ts">
	export let title: string;
	export let options: string[];
	export let optionSelected: string[];
</script>

<details
	class="overflow-hidden rounded border border-gray-300 [&_summary::-webkit-details-marker]:hidden"
>
	<summary
		class="flex cursor-pointer items-center justify-between gap-2 bg-white p-4 text-gray-900 transition"
	>
		<span class="text-sm font-medium">{title}</span>

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

	<div class="border border-gray-200 bg-white rounded absolute">
		<header class="flex items-center justify-between p-4">
			<span class="text-sm text-gray-700">{optionSelected.length} Selected</span>

			<button
				type="button"
				class="text-sm text-gray-900 underline underline-offset-4"
				on:click={() => (optionSelected = [])}
			>
				Reset
			</button>
		</header>

		<ul class="space-y-1 border-t border-gray-200 p-4">
			{#each options as option}
				<li>
					<label for="FilterInStock" class="inline-flex items-center gap-2">
						<input
							checked={optionSelected.includes(option)}
							type="checkbox"
							id="FilterInStock"
							class="h-5 w-5 rounded border-gray-300"
							on:input={() => {
								if (optionSelected.includes(option)) {
									optionSelected.splice(optionSelected.indexOf(option), 1);
									optionSelected = optionSelected;
								} else optionSelected = [...optionSelected, option];
							}}
						/>
						<span class="text-sm font-medium text-gray-700">{option}</span>
					</label>
				</li>
			{/each}
		</ul>
	</div>
</details>
