import { Map, Layers, LocateFixed, Radio, X } from 'lucide-react';
import type { RefObject } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type {
  CommunityReport,
  CountryConfig,
  CountryGeography,
  GeoPosition,
  RiversResponse,
  WeatherPoint,
} from '@geowatch/shared';
import type { MapAdapter, MapLayer, MapSelection } from '../../map/MapAdapter';
import { MapView } from './MapView';
import { DetailPanel } from './DetailPanel';
import { ReportForm } from '../reports/ReportForm';
const empty: never[] = [];
interface Props {
  country: CountryConfig;
  geography: UseQueryResult<CountryGeography, Error>;
  rivers: UseQueryResult<RiversResponse, Error>;
  weather: WeatherPoint[];
  reports: CommunityReport[];
  visibility: Record<MapLayer, boolean>;
  reporting: boolean;
  picked: GeoPosition | null;
  currentSelection: MapSelection | null;
  notice: string;
  connected: boolean;
  map: RefObject<MapAdapter | null>;
  onDrawer(): void;
  onSelect(selection: MapSelection): void;
  onPicked(p: GeoPosition): void;
  onViewport(b: [number, number, number, number]): void;
  onCloseReport(): void;
  onCloseSelection(): void;
  onNotice(value: string): void;
}
export function MapWorkspace({
  country,
  geography,
  rivers,
  weather,
  reports,
  visibility,
  reporting,
  picked,
  currentSelection,
  notice,
  connected,
  map,
  onDrawer,
  onSelect,
  onPicked,
  onViewport,
  onCloseReport,
  onCloseSelection,
  onNotice,
}: Props) {
  return (
    <section className="map-section" aria-label="Regional monitoring map">
      <div className="map-toolbar">
        <div>
          <span className="map-toolbar-icon">
            <Map size={16} />
          </span>
          <strong>Moldova</strong>
          <span className="toolbar-divider" />
          <span className="muted">Interactive map</span>
        </div>
        <div className="map-toolbar-right">
          <span className="map-engine">
            {import.meta.env.VITE_MAP_PROVIDER === 'luciad'
              ? 'LuciadRIA'
              : 'OpenStreetMap · Leaflet'}
          </span>
          <button
            className="mobile-layers outline-button"
            onClick={() => onDrawer()}
          >
            <Layers size={15} />
            Layers & filters
          </button>
          <button
            className="icon-button"
            onClick={() => map.current?.resetView()}
            aria-label="Reset map to Moldova"
          >
            <LocateFixed size={19} />
          </button>
        </div>
      </div>
      <div className="map-stage">
        {geography.data ? (
          <MapView
            country={country}
            geography={geography.data}
            weather={weather}
            rivers={rivers.data?.features ?? empty}
            reports={reports}
            visibility={visibility}
            picking={reporting}
            picked={picked}
            callbacks={{
              onSelect: onSelect,
              onPosition: onPicked,
              onViewport: onViewport,
            }}
            onReady={(adapter) => {
              map.current = adapter;
            }}
          />
        ) : (
          <div className="map-placeholder">
            <Map size={36} />
            <p>
              {geography.isError
                ? 'Could not load the country geography.'
                : 'Loading Moldova’s geography…'}
            </p>
            {geography.isError && (
              <button
                className="outline-button"
                onClick={() => {
                  void geography.refetch();
                }}
              >
                Retry map
              </button>
            )}
          </div>
        )}
        <div className="map-context">
          <span className="status-dot connected" />
          {reporting
            ? 'Choose a report location on the map'
            : 'Explore your region'}
          <small>
            {reporting
              ? 'Coordinates can also be entered in the form'
              : 'Click a marker or river for details'}
          </small>
        </div>
        {!reporting && !currentSelection && (
          <div className="map-legend">
            <strong>ON THE MAP</strong>
            {visibility.weather && (
              <span>
                <i className="legend-weather" />
                Weather °C
              </span>
            )}
            {visibility.rivers && (
              <span>
                <i className="legend-river" />
                River geometry
              </span>
            )}
            {visibility.reports && (
              <span>
                <i className="legend-report" />
                Community report
              </span>
            )}
          </div>
        )}
        {reporting && (
          <ReportForm
            country={country.code}
            position={picked}
            onPosition={onPicked}
            onClose={onCloseReport}
            onCreated={() => {
              onCloseReport();
              onNotice(
                'Report submitted. Thank you for helping your community.',
              );
            }}
          />
        )}
        {currentSelection && !reporting && (
          <DetailPanel
            key={
              currentSelection.type +
              (currentSelection.type === 'report'
                ? currentSelection.data.id
                : currentSelection.type === 'weather'
                  ? currentSelection.data.name
                  : currentSelection.data.properties.id)
            }
            selection={currentSelection}
            observations={rivers.data?.observations ?? empty}
            riverFeatures={rivers.data?.features ?? empty}
            onRiverSelect={(feature) =>
              onSelect({ type: 'river', data: feature })
            }
            onClose={() => onCloseSelection()}
          />
        )}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              className="icon-button"
              onClick={() => onNotice('')}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="map-footer">
        <span>
          <Radio size={13} />
          {connected
            ? 'Community updates in real time'
            : 'Community updates every minute'}
        </span>
        <span>
          Weather: {weather.length ? 'live model' : 'unavailable'}
          <i />
          Water levels: demo
        </span>
      </div>
    </section>
  );
}
