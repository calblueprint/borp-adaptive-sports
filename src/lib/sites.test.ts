import { searchSites } from './sites';

// Two made-up trails to search through
const sites = [
  { id: '1', name: 'Jewel Lake Boardwalk', lat: 37.9, lng: -122.26 },
  { id: '2', name: 'Lake Merritt Loop', lat: 37.8, lng: -122.25 },
];

describe('searchSites', () => {
  it('finds a trail by part of its name, ignoring capital letters', () => {
    const results = searchSites(sites, 'jewel');
    expect(results).toEqual([sites[0]]);
  });

  it('returns every trail when the search box is empty', () => {
    expect(searchSites(sites, '')).toEqual(sites);
  });
});
