import type { PageServerLoad } from './$types';
import csv from 'csvtojson';

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

	await csv()
		.fromFile('../fullWish.csv')
		.then((data) => {
			console.log('First element:', data[0]);
			items = data.filter((e) => e.TotalPrice !== 'unavailable');
		});

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
