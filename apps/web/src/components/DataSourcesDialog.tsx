import { useRef } from 'react';
import { useFocusScope } from '../hooks/useFocusScope';
import { X } from 'lucide-react';
import type { CountryGeography } from '@geowatch/shared';
import { SourceBadge } from './SourceBadge';
export function DataSourcesDialog({
  geography,
  onClose,
}: {
  geography?: CountryGeography;
  onClose(): void;
}) {
  const panel = useRef<HTMLElement>(null);
  useFocusScope(true, panel, onClose);
  return (
    <div className="sources-overlay" onClick={() => onClose()}>
      <section
        className="sources-panel"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <h2 id="sources-heading">Know your data</h2>
          <button
            className="icon-button"
            onClick={() => onClose()}
            aria-label="Close data sources"
          >
            <X size={20} />
          </button>
        </div>
        <p>Each source has a different purpose and freshness.</p>
        <ul>
          <li>
            <SourceBadge mode="STATIC" />
            <strong>Map & geography</strong>
            <p>
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap contributors
              </a>{' '}
              · ODbL. Borders, cities and river centerlines:{' '}
              <a
                href="https://www.naturalearthdata.com/about/terms-of-use/"
                target="_blank"
                rel="noreferrer"
              >
                Natural Earth
              </a>{' '}
              · public domain, generalized 1:10m.
            </p>
            {geography && (
              <small>
                Extracted{' '}
                {new Date(geography.source.retrievedAt).toLocaleDateString()}
              </small>
            )}
          </li>
          <li>
            <SourceBadge mode="LIVE" />
            <strong>Weather model</strong>
            <p>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
              >
                Weather data by Open-Meteo
              </a>{' '}
              · CC BY 4.0. Current model conditions, refreshed every five
              minutes. Free service is for noncommercial use.
            </p>
          </li>
          <li>
            <SourceBadge mode="DEMO" />
            <strong>Water levels</strong>
            <p>
              Fixed synthetic examples dated January 1, 2026. No live gauge API
              is connected. See{' '}
              <a
                href="https://www.meteo.md/index.php/hidrologie/prognoze/"
                target="_blank"
                rel="noreferrer"
              >
                official hydrology bulletins
              </a>{' '}
              for authority information.
            </p>
          </li>
          <li>
            <strong>Place search</strong>
            <p>
              <a
                href="https://open-meteo.com/en/docs/geocoding-api"
                target="_blank"
                rel="noreferrer"
              >
                Open-Meteo / GeoNames
              </a>{' '}
              · CC BY 4.0. Explicit searches cached for 24 hours.
            </p>
          </li>
          <li>
            <strong>Community reports</strong>
            <p>
              Real user submissions, stored locally in PostGIS. Anonymous and
              unverified. Do not use this application as an emergency warning
              service.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
}
