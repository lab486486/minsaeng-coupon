import { getCollection, type CollectionEntry } from 'astro:content';

export type RegionalGrant = CollectionEntry<'regionalGrants'>;

export async function getPublishedRegionalGrants(): Promise<RegionalGrant[]> {
  const all = await getCollection('regionalGrants', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.verifiedAt.localeCompare(a.data.verifiedAt));
}
