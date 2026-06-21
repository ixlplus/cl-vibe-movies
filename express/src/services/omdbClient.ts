export type OmdbSearchResult = {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
};

export type OmdbSearchResponse = {
  Response: 'True' | 'False';
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Error?: string;
};

export type OmdbMovieDetailsResponse = {
  Response: 'True' | 'False';
  Title?: string;
  Year?: string;
  Plot?: string;
  Poster?: string;
  Director?: string;
  Genre?: string;
  imdbID?: string;
  Error?: string;
};

export async function omdbSearch(apiKey: string, query: string): Promise<OmdbSearchResult[]> {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&s=${encodeURIComponent(query)}&type=movie`;
  const resp = await fetch(url);
  const json = (await resp.json()) as OmdbSearchResponse;
  if (json.Response !== 'True' || !json.Search) return [];
  return json.Search;
}

export async function omdbMovieDetails(apiKey: string, imdbId: string): Promise<OmdbMovieDetailsResponse> {
  const url = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&i=${encodeURIComponent(imdbId)}&plot=full`;
  const resp = await fetch(url);
  return (await resp.json()) as OmdbMovieDetailsResponse;
}