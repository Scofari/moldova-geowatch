import {
  Layers,
  CloudSun,
  Waves,
  MessageSquare,
  SlidersHorizontal,
  ChevronDown,
  X,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import {
  categoryLabels,
  type CommunityReport,
  type ReportCategory,
} from '@geowatch/shared';
import type { MapLayer } from '../map/MapAdapter';
import type { useReports } from '../hooks/useReports';
import { ReportList } from '../features/reports/ReportList';
import { useRef } from 'react';
import { useFocusScope } from '../hooks/useFocusScope';
interface Props {
  drawer: boolean;
  visibility: Record<MapLayer, boolean>;
  category: ReportCategory | 'all';
  reportQuery: ReturnType<typeof useReports>;
  reports: CommunityReport[];
  onLayerToggle(layer: MapLayer, value: boolean): void;
  onCategory(value: ReportCategory | 'all'): void;
  onSelect(report: CommunityReport): void;
  onCreate(): void;
  onRiver(): void;
  onSources(): void;
  onClose(): void;
}
export function Sidebar({
  drawer,
  visibility,
  category,
  reportQuery,
  reports,
  onLayerToggle,
  onCategory,
  onSelect,
  onCreate,
  onRiver,
  onSources,
  onClose,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  useFocusScope(drawer, panel, onClose);
  const layers = [
    {
      id: 'weather' as const,
      title: 'Weather',
      description: 'Current model conditions',
      icon: CloudSun,
    },
    {
      id: 'rivers' as const,
      title: 'Rivers & water',
      description: 'Nistru and Prut',
      icon: Waves,
    },
    {
      id: 'reports' as const,
      title: 'Community reports',
      description: 'Local, unverified observations',
      icon: MessageSquare,
    },
  ];
  return (
    <aside
      ref={panel}
      role={drawer ? 'dialog' : undefined}
      aria-modal={drawer ? true : undefined}
      className={'sidebar ' + (drawer ? 'drawer-open' : '')}
      aria-label="Layers and report filters"
    >
      <div className="region-card">
        <span className="country-flag" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <small>MONITORING REGION</small>
          <strong>Republic of Moldova</strong>
        </div>
        <ChevronDown size={15} />
      </div>
      <button
        className="mobile-close icon-button"
        aria-label="Close layers"
        onClick={() => onClose()}
      >
        <X size={20} />
      </button>
      <div className="sidebar-scroll">
        <div className="sidebar-section">
          <div className="section-heading">
            <h3>
              <Layers size={15} />
              Map layers
            </h3>
            <span className="muted">
              {Object.values(visibility).filter(Boolean).length} active
            </span>
          </div>
          {layers.map((layer) => (
            <label
              className={
                'layer-item ' + (visibility[layer.id] ? 'enabled' : '')
              }
              key={layer.id}
            >
              <span className={'layer-icon ' + layer.id}>
                <layer.icon size={19} />
              </span>
              <span className="layer-copy">
                <strong>{layer.title}</strong>
                <small>{layer.description}</small>
              </span>
              <input
                type="checkbox"
                checked={visibility[layer.id]}
                onChange={(e) => onLayerToggle(layer.id, e.target.checked)}
                aria-label={'Show ' + layer.title}
              />
            </label>
          ))}
          <button
            className="text-button river-readings-button"
            onClick={onRiver}
          >
            <Waves size={14} />
            View river readings
          </button>
        </div>
        <div className="sidebar-section filter-section">
          <div className="section-heading">
            <h3>
              <SlidersHorizontal size={15} />
              Report filters
            </h3>
          </div>
          <div className="filter-options">
            {(
              ['all', ...Object.keys(categoryLabels)] as (
                ReportCategory | 'all'
              )[]
            ).map((key) => (
              <button
                key={key}
                className={'filter-chip ' + (category === key ? 'active' : '')}
                aria-pressed={category === key}
                onClick={() => onCategory(key)}
              >
                {key === 'all' ? 'All reports' : categoryLabels[key]}
              </button>
            ))}
          </div>
        </div>
        <ReportList
          reports={reports}
          loading={reportQuery.isPending}
          error={reportQuery.isError ? reportQuery.error.message : undefined}
          truncated={reportQuery.data?.truncated}
          onRetry={() => {
            void reportQuery.refetch();
          }}
          onSelect={(r) => {
            onSelect(r);
          }}
        />
      </div>
      <div className="sidebar-bottom">
        <button className="primary-button full-width" onClick={onCreate}>
          <Plus size={19} />
          Report a problem
        </button>
        <p>
          <span
            className={
              'status-dot ' +
              (reportQuery.connected ? 'connected' : 'disconnected')
            }
          />
          {reportQuery.connected
            ? 'Real-time updates connected'
            : 'Real-time disconnected · polling every minute'}
        </p>
        <button className="text-button" onClick={() => onSources()}>
          Data sources & attribution
          <ArrowUpRight size={13} />
        </button>
      </div>
    </aside>
  );
}
