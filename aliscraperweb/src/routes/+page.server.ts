import type { PageServerLoad } from './$types';
import csv from 'csvtojson';
import fs from 'fs';

export const load = (async () => {
	let items = [
		{
			Wishlist: 'string',
			ProductName: 'string',
			ImageURL: 'string',
			Price: 'string',
			Shipping: 'string',
			TotalPrice: 'string',
			ProdURL: 'string'
		}
	];

	let over_items = [
		{
			Wishlist: 'string',
			ProductName: 'string',
			ImageURL: 'string',
			Price: 'string',
			Shipping: 'string',
			TotalPrice: 'string',
			ProdURL: 'string'
		}
	];

	await csv()
		.fromFile('../fullWish.csv')
		.then((data) => {
			console.log('First element:', data[0]);
			items = data;
		});

	if (fs.existsSync('../fullWish_over.csv')) {
		//file exists
		await csv()
			.fromFile('../fullWish_over.csv')
			.then((data) => {
				console.log('First override:', data[0]);
				over_items = data;
			});

		//replace overrides
		for (const over of over_items) {
			const replaceIdx = items.findIndex((e) => {
				return e.ProdURL === over.ProdURL;
			});
			if (replaceIdx !== -1) items[replaceIdx] = over;
		}
	}

	let wishlists: string[] = [];
	items.forEach((e) =>
		!wishlists.includes(e.Wishlist) ? (wishlists = [...wishlists, e.Wishlist]) : null
	);

	// sort items by price
	items.sort((a, b) => {
		return parseFloat(a.TotalPrice) - parseFloat(b.TotalPrice);
	});

	return {
		items,
		wishlists
	};
}) satisfies PageServerLoad;
