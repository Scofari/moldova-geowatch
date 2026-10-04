import {
  X,
  Wind,
  CloudRain,
  Thermometer,
  ThumbsUp,
  MapPin,
  Waves,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  categoryLabels,
  weatherDescription,
  type RiverObservation,
  type RiverFeature,
} from '@geowatch/shared';
import type { MapSelection } from '../../map/MapAdapter';
import { SourceBadge } from '../../components/SourceBadge';
import { api } from '../../api/client';
export function DetailPanel({
  selection,
  observations,
  onClose,
  riverFeatures,
  onRiverSelect,
}: {
  selection: MapSelection;
  observations: RiverObservation[];
  onClose(): void;
  riverFeatures: RiverFeature[];
  onRiverSelect(feature: RiverFeature): void;
}) {
  const client = useQueryClient();
  const initialReport = selection.type === 'report' ? selection.data : null;
  const reportQuery = useQuery({
    queryKey: ['report', initialReport?.id],
    queryFn: () => api.report(initialReport!.id),
    enabled: !!initialReport,
    initialData: initialReport ?? undefined,
  });
  const r = initialReport ? (reportQuery.data ?? initialReport) : null;
  const confirm = useMutation({
    mutationFn: api.confirm,
    onSuccess: (report) => {
      client.setQueryData(['report', report.id], report);
      void client.invalidateQueries({ queryKey: ['reports'] });
    },
  });
  const w = selection.type === 'weather' ? selection.data : null;
  const river = selection.type === 'river' ? selection.data : null;
  const observation = observations.find(
    (o) => o.riverId === river?.properties.id,
  );
  return (
    <section
      className="detail-panel floating-panel"
      aria-label="Map object details"
    >
      <div className="panel-heading">
        <span className="eyebrow">
          {r
            ? 'COMMUNITY REPORT'
            : w
              ? 'CURRENT CONDITIONS'
              : 'RIVER MONITORING'}
        </span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close details"
        >
          <X size={18} />
        </button>
      </div>
      {w && (
        <>
          <h2>{w.name || 'Selected location'}</h2>
          <SourceBadge mode={w.source.mode} />
          <div className="temperature-display">
            {Math.round(w.temperature)}
            <span>°C</span>
          </div>
          <p>{weatherDescription(w.weatherCode)}</p>
          <div className="detail-metrics">
            <span>
              <Wind size={17} />
              Wind<strong>{w.windSpeed} km/h</strong>
            </span>
            <span>
              <CloudRain size={17} />
              Precipitation<strong>{w.precipitation} mm</strong>
            </span>
          </div>
          <p className="detail-note">
            <Thermometer size={15} />
            Current modeled conditions
          </p>
          <time className="timestamp" dateTime={w.observedAt}>
            Model time: {new Date(w.observedAt).toLocaleString()}
          </time>
          <time className="timestamp" dateTime={w.source.retrievedAt}>
            Fetched: {new Date(w.source.retrievedAt).toLocaleTimeString()}
          </time>
          <a
            className="source-link"
            href={w.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Weather data by Open-Meteo · CC BY 4.0
          </a>
        </>
      )}
      {river && (
        <>
          <label className="river-switch">
            River
            <select
              aria-label="Select river"
              value={river.properties.id}
              onChange={(event) => {
                const feature = riverFeatures.find(
                  (f) => f.properties.id === event.target.value,
                );
                if (feature) onRiverSelect(feature);
              }}
            >
              {[
                ...new Map(
                  riverFeatures.map((feature) => [
                    feature.properties.id,
                    feature,
                  ]),
                ).values(),
              ].map((feature) => (
                <option
                  key={feature.properties.id}
                  value={feature.properties.id}
                >
                  {feature.properties.name}
                </option>
              ))}
            </select>
          </label>
          <h2>
            <Waves size={23} />
            {river.properties.name}
          </h2>
          <p className="detail-note">Real river geometry · Natural Earth</p>
          <div className="demo-notice">
            <SourceBadge mode="DEMO" />
            <strong>Synthetic water-level example</strong>
            <p>
              No live gauge source is connected. These readings must not be used
              for safety decisions.
            </p>
          </div>
          {observation && (
            <>
              <div className="water-level">
                {observation.waterLevel} <span>{observation.unit}</span>
              </div>
              <p>Example status: {observation.status.replaceAll('_', ' ')}</p>
              <p className="timestamp">
                {observation.stationId} · Fixed fixture{' '}
                {new Date(observation.observedAt).toLocaleDateString()}
              </p>
            </>
          )}
          <a
            className="source-link"
            href="https://www.meteo.md/index.php/hidrologie/prognoze/"
            target="_blank"
            rel="noreferrer"
          >
            Read official hydrology bulletins ↗
          </a>
        </>
      )}
      {r && (
        <>
          <h2>{r.title}</h2>
          <span className={'category-tag ' + r.category}>
            {categoryLabels[r.category]}
          </span>
          {r.description && (
            <p className="report-description">{r.description}</p>
          )}
          <p className="detail-note">
            <MapPin size={15} />
            {r.position.latitude.toFixed(5)}, {r.position.longitude.toFixed(5)}
          </p>
          <p className="timestamp">
            Reported {new Date(r.createdAt).toLocaleString()}
          </p>
          <div className="confirmation-count">
            <ThumbsUp size={18} />
            <strong>{r.confirmations}</strong> confirmations
          </div>
          {confirm.isError && (
            <p className="inline-error" role="alert">
              {confirm.error.message}
            </p>
          )}
          {confirm.isSuccess && (
            <p className="success-note" role="status">
              Your confirmation was recorded.
            </p>
          )}
          <button
            className="primary-button full-width"
            disabled={confirm.isPending || confirm.isSuccess}
            onClick={() => confirm.mutate(r.id)}
          >
            <ThumbsUp size={16} />
            {confirm.isPending
              ? 'Confirming…'
              : confirm.isSuccess
                ? 'Confirmed'
                : 'I can confirm this'}
          </button>
          <p className="privacy-note">
            Confirm only if you have observed this problem. Community reports
            are not verified by authorities.
          </p>
        </>
      )}
    </section>
  );
}
