import type { PageLoad } from './$types';

export const load = (async ({ data }) => {
	return {
		serverData: data
	};
}) satisfies PageLoad;
