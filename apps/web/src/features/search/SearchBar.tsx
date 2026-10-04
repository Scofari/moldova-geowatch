import { useState, type FormEvent } from 'react';
import { Search, X, MapPin, LoaderCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { LocationResult } from '@geowatch/shared';
import { api } from '../../api/client';
export function SearchBar({
  country,
  onSelect,
}: {
  country: string;
  onSelect(result: LocationResult): void;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ['search', country, submitted],
    queryFn: () => api.search(submitted, country),
    enabled: !!submitted,
    staleTime: 24 * 60 * 60_000,
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (input.trim().length >= 2) {
      setSubmitted(input.trim());
      setOpen(true);
    }
  }
  return (
    <div className="search-wrapper">
      <form className="search-bar" onSubmit={submit} role="search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Search locations in Moldova"
          placeholder="Search a city or place…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minLength={2}
          maxLength={100}
        />
        {input && (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear search"
            onClick={() => {
              setInput('');
              setOpen(false);
            }}
          >
            <X size={15} />
          </button>
        )}
        <button type="submit" className="search-submit">
          Search
        </button>
      </form>
      {open && (
        <div className="search-results">
          <div className="search-result-heading">
            PLACES IN MOLDOVA{' '}
            <button
              className="icon-button"
              aria-label="Close search results"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
            </button>
          </div>
          {query.isFetching && (
            <p>
              <LoaderCircle size={16} /> Searching places…
            </p>
          )}
          {query.isError && <p role="alert">{query.error.message}</p>}
          {query.data?.results.length === 0 && (
            <p>No places found. Try another spelling.</p>
          )}
          {query.data?.results.map((r) => (
            <button
              key={r.id}
              className="search-result"
              onClick={() => {
                onSelect(r);
                setOpen(false);
              }}
            >
              <MapPin size={17} />
              <span>
                {r.name}
                <small>{r.region || r.countryCode}</small>
              </span>
            </button>
          ))}
          {query.data && (
            <a
              className="source-link"
              href={query.data.source.url}
              target="_blank"
              rel="noreferrer"
            >
              Place data: Open-Meteo / GeoNames
            </a>
          )}
        </div>
      )}
    </div>
  );
}
