import { Map, Info } from 'lucide-react';
import type { LocationResult } from '@geowatch/shared';
import { SearchBar } from '../features/search/SearchBar';
interface Props {
  countryCode: string;
  health: { isSuccess: boolean; isPending: boolean };
  onLocation(result: LocationResult): void;
  onSources(): void;
}
export function Topbar({ countryCode, health, onLocation, onSources }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Map size={24} />
        </span>
        <div>
          <strong>
            Moldova <span>GeoWatch</span>
          </strong>
          <small>OPEN DATA. LOCAL INSIGHT.</small>
        </div>
      </div>
      <SearchBar
        country={countryCode}
        onSelect={(r) => {
          onLocation(r);
        }}
      />
      <div className="topbar-actions">
        <span
          className={
            'connection-status ' + (health.isSuccess ? 'online' : 'offline')
          }
        >
          <span className="status-dot" />
          {health.isSuccess
            ? 'Data service connected'
            : health.isPending
              ? 'Connecting…'
              : 'Data service offline'}
        </span>
        <button
          className="icon-button source-button"
          aria-label="View data sources"
          onClick={() => onSources()}
        >
          <Info size={20} />
        </button>
      </div>
    </header>
  );
}
