import { useEffect, useRef, useState } from 'react';
import type {
  CommunityReport,
  CountryConfig,
  CountryGeography,
  GeoPosition,
  RiverFeature,
  WeatherPoint,
} from '@geowatch/shared';
import type { MapAdapter, MapCallbacks, MapLayer } from '../../map/MapAdapter';
import { OpenSourceMapAdapter } from '../../map/OpenSourceMapAdapter';
import { LuciadMapAdapter } from '../../map/LuciadMapAdapter';
interface Props {
  country: CountryConfig;
  geography: CountryGeography;
  weather: WeatherPoint[];
  rivers: RiverFeature[];
  reports: CommunityReport[];
  visibility: Record<MapLayer, boolean>;
  picking: boolean;
  picked: GeoPosition | null;
  callbacks: MapCallbacks;
  onReady(adapter: MapAdapter): void;
}
export function MapView(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState<MapAdapter | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!container.current) return;
    setError('');
    let active = true;
    const options = {
      country: props.country,
      geography: props.geography,
      callbacks: {
        onSelect: (selection: Parameters<MapCallbacks['onSelect']>[0]) =>
          latest.current.callbacks.onSelect(selection),
        onPosition: (position: GeoPosition) =>
          latest.current.callbacks.onPosition(position),
        onViewport: (bbox: [number, number, number, number]) =>
          latest.current.callbacks.onViewport(bbox),
      },
    };
    const adapter =
      import.meta.env.VITE_MAP_PROVIDER === 'luciad'
        ? new LuciadMapAdapter(options)
        : new OpenSourceMapAdapter(options);
    adapterRef.current = adapter;
    adapter
      .initialize(container.current)
      .then(() => {
        if (active) {
          // The adapter identity forces all layer effects to replay on reinitialization.
          setReady(adapter);
          latest.current.onReady(adapter);
        }
      })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error ? e.message : 'Map initialization failed.',
          );
      });
    return () => {
      active = false;
      adapter.destroy();
      adapterRef.current = null;
    };
  }, [props.country, props.geography]);
  useEffect(() => {
    if (ready) adapterRef.current?.addWeatherPoints(props.weather);
  }, [ready, props.weather]);
  useEffect(() => {
    if (ready) adapterRef.current?.addRiverFeatures(props.rivers);
  }, [ready, props.rivers]);
  useEffect(() => {
    if (ready) adapterRef.current?.addReports(props.reports);
  }, [ready, props.reports]);
  useEffect(() => {
    if (ready)
      for (const [layer, visible] of Object.entries(props.visibility))
        adapterRef.current?.setLayerVisibility(layer as MapLayer, visible);
  }, [ready, props.visibility]);
  useEffect(() => {
    if (ready) adapterRef.current?.setPicking(props.picking);
  }, [ready, props.picking]);
  useEffect(() => {
    if (ready) adapterRef.current?.showPickedPosition(props.picked);
  }, [ready, props.picked]);
  return (
    <>
      <div
        className="map-canvas"
        ref={container}
        aria-label="Interactive map of Moldova"
      />
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
