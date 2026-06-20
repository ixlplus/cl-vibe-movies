import React, { useEffect, useMemo, useState } from 'react';

import './App.css';

type OmdbSearchItem = {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
};

type OmdbMovieDetails = {
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

type SavedMovie = {
  imdbID: string;
  Title?: string;
  Year?: string;
  Plot?: string;
  PosterDataUrl?: string | null;
  Director?: string;
  Genre?: string;
  savedAt: string;
};

const API_BASE = 'http://localhost:3001';

function usePathname() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return path;
}

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function App() {
  const pathname = usePathname();

  const [omdbKey, setOmdbKey] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OmdbSearchItem[]>([]);
  const [selected, setSelected] = useState<OmdbSearchItem | null>(null);
  const [details, setDetails] = useState<OmdbMovieDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMovies, setSavedMovies] = useState<SavedMovie[]>([]);

  const isSettings = useMemo(() => pathname === '/settings', [pathname]);
  const isAddPage = useMemo(() => pathname === '/add', [pathname]);

  useEffect(() => {
    setError(null);

    if (isSettings) {
      (async () => {
        const resp = await fetch(`${API_BASE}/api/settings/omdb`);
        if (!resp.ok) return;
        const json = (await resp.json()) as { apiKey?: string };
        setOmdbKey(json.apiKey ?? '');
      })().catch(() => {
        // ignore
      });
    }
  }, []);

  useEffect(() => {
    if (pathname !== '/') return;
    setSavedMovies(loadSavedMovies());
  }, [pathname]);

  async function onSearch() {
    setError(null);
    setSelected(null);
    setDetails(null);
    const q = query.trim();
    if (!q) return;

    const resp = await fetch(`${API_BASE}/api/omdb/search?q=${encodeURIComponent(q)}`);
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      setError(json.error ?? 'Search failed');
      return;
    }
    const json = (await resp.json()) as OmdbSearchItem[];
    setResults(json);
  }

  async function onSelect(item: OmdbSearchItem) {
    setSelected(item);
    setDetails(null);
    setError(null);

    const resp = await fetch(`${API_BASE}/api/omdb/movie/${encodeURIComponent(item.imdbID)}`);
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      setError(json.error ?? 'Failed to load movie details');
      return;
    }
    const json = (await resp.json()) as OmdbMovieDetails;
    setDetails(json);
  }

  async function posterUrlToDataUrl(posterUrl: string): Promise<string | null> {
    if (!posterUrl || posterUrl === 'N/A') return null;
    try {
      console.log('[vibemovies] posterUrlToDataUrl start', { posterUrl });
      const resp = await fetch(posterUrl);
      console.log('[vibemovies] posterUrlToDataUrl fetch status', { ok: resp.ok, status: resp.status });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      console.log('[vibemovies] posterUrlToDataUrl blob size', { size: blob.size, type: blob.type });
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.readAsDataURL(blob);
      });
    } catch {
      console.log('[vibemovies] posterUrlToDataUrl failed');
      return null;
    }
  }

  function loadSavedMovies(): SavedMovie[] {
    try {
      const raw = window.localStorage.getItem('vibemovies:saved');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedMovie[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function persistSavedMovies(movies: SavedMovie[]) {
    window.localStorage.setItem('vibemovies:saved', JSON.stringify(movies));
  }

  async function onSaveSelected() {
    if (isSaving) return;
    setSaveStatus(null);
    setError(null);

    setIsSaving(true);

    if (!details?.imdbID) {
      setError('Select a movie first.');
      setIsSaving(false);
      return;
    }

    console.log('[vibemovies] onSaveSelected start', {
      imdbID: details.imdbID,
      Title: details.Title,
      Poster: details.Poster
    });

    const posterDataUrl = details.Poster ? await posterUrlToDataUrl(details.Poster) : null;

    console.log('[vibemovies] onSaveSelected posterDataUrl ready', {
      hasPosterDataUrl: !!posterDataUrl,
      posterDataUrlPrefix: posterDataUrl ? posterDataUrl.slice(0, 30) : null
    });

    const saved: SavedMovie = {
      imdbID: details.imdbID,
      Title: details.Title,
      Year: details.Year,
      Plot: details.Plot,
      PosterDataUrl: posterDataUrl,
      Director: details.Director,
      Genre: details.Genre,
      savedAt: new Date().toISOString()
    };

    const existing = loadSavedMovies();
    console.log('[vibemovies] onSaveSelected existing saved count', { count: existing.length });
    const next = [saved, ...existing.filter((m) => m.imdbID !== saved.imdbID)];
    persistSavedMovies(next);
    setSaveStatus('Saved to local storage');
    console.log('[vibemovies] onSaveSelected done', { nextCount: next.length });

    if (pathname === '/') setSavedMovies(next);

    setIsSaving(false);
  }

  return (
    <div className="vm-root">
      <header className="vm-header">
        <h1 className="vm-title">VibeMovies</h1>
        <nav className="vm-nav">
          <button
            onClick={() => navigate('/')}
            className={`vm-btn ${pathname === '/' ? 'vm-btn--active' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`vm-btn ${pathname === '/settings' ? 'vm-btn--active' : ''}`}
          >
            Settings
          </button>
        </nav>
      </header>

      {isSettings ? (
        <section className="vm-card">
          <h2 className="vm-section-title">Settings</h2>
          <p className="vm-subtext">
            Enter your OMDb API key to search and retrieve movie information.
          </p>
          <input
            value={omdbKey}
            onChange={(e) => setOmdbKey(e.target.value)}
            placeholder="Enter your OMDb API key"
            type="password"
            className="vm-input"
          />
          <button
            onClick={async () => {
              setError(null);
              const resp = await fetch(`${API_BASE}/api/settings/omdb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: omdbKey })
              });
              if (!resp.ok) {
                const json = await resp.json().catch(() => ({}));
                setError(json.error ?? 'Failed to save key');
                return;
              }
              setError('Saved');
            }}
            className="vm-dark"
          >
            Save key
          </button>
          {error ? <div className="vm-error">{error}</div> : null}
        </section>
      ) : isAddPage ? (
        <>
          <section className="vm-card">
            <h2 className="vm-section-title">Add Movie</h2>
            <div className="vm-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Inception"
                className="vm-input--search"
              />
              <button
                onClick={onSearch}
                className="vm-primary"
              >
                Search
              </button>
            </div>

            {error ? <div className="vm-error">{error}</div> : null}

            <div className="vm-grid">
              {results.map((r) => (
                <button
                  key={r.imdbID}
                  onClick={() => onSelect(r)}
                  className={`vm-movie ${selected?.imdbID === r.imdbID ? 'vm-movie--selected' : ''}`}
                >
                  <div className="vm-movie-title">{r.Title}</div>
                  <div className="vm-movie-meta">{r.Year}</div>
                  <div className="vm-movie-meta">{r.Type}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="vm-card">
            <h2 className="vm-section-title">Details</h2>
            {!selected ? (
              <p className="vm-details-help">Select a movie to view details.</p>
            ) : details ? (
              <div className="vm-details-block">
                <div className="vm-details-row">
                  {details.Poster ? (
                    <img className="vm-details-poster" src={details.Poster} alt={details.Title ?? 'Poster'} />
                  ) : null}
                  <div>
                    <div className="vm-details-heading">{details.Title}</div>
                    <div className="vm-movie-meta">{details.Year}</div>
                    <div className="vm-movie-meta">Director: {details.Director}</div>
                    <div className="vm-movie-meta">Genre: {details.Genre}</div>
                  </div>
                </div>
                <div className="vm-details-plot">{details.Plot}</div>

                <div className="vm-save-row">
                  <button
                    className="vm-primary"
                    onClick={onSaveSelected}
                    disabled={isSaving}
                    style={isSaving ? { cursor: 'default', opacity: 0.85 } : undefined}
                  >
                    Save to local
                  </button>
                  {saveStatus ? <div className="vm-muted vm-save-status">{saveStatus}</div> : null}
                </div>
              </div>
            ) : (
              <p className="vm-loading">Loading...</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="vm-card">
            <h2 className="vm-section-title">Saved Movies</h2>
            <div className="vm-row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                onClick={() => navigate('/add')}
                className="vm-primary"
              >
                Add Movie
              </button>
            </div>
            {savedMovies.length === 0 ? (
              <p className="vm-subtext">No saved movies yet. Select a movie and click “Save to local”.</p>
            ) : (
              <div className="vm-grid">
                {savedMovies.map((m) => (
                  <div key={m.imdbID} className="vm-saved">
                    {m.PosterDataUrl ? (
                      <img className="vm-saved-poster" src={m.PosterDataUrl} alt={m.Title ?? 'Saved poster'} />
                    ) : null}
                    <div className="vm-saved-title">{m.Title ?? m.imdbID}</div>
                    <div className="vm-saved-meta">{m.Year ?? ''}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
