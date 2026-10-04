import { MapPin, ArrowUpRight, MessageSquare, RefreshCw } from 'lucide-react';
import { categoryLabels, type CommunityReport } from '@geowatch/shared';
export function relativeTime(iso: string): string {
  const mins = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (mins < 1440) return Math.floor(mins / 60) + 'h ago';
  return Math.floor(mins / 1440) + 'd ago';
}
export function ReportList({
  reports,
  loading,
  error,
  truncated,
  onSelect,
  onRetry,
}: {
  reports: CommunityReport[];
  loading: boolean;
  error?: string;
  truncated?: boolean;
  onSelect(report: CommunityReport): void;
  onRetry(): void;
}) {
  return (
    <section className="report-list">
      <div className="section-heading">
        <h3>Community activity</h3>
        <span className="count-pill">
          {reports.length}
          {truncated ? '+' : ''}
        </span>
      </div>
      <p className="section-caption">Reports in your current map view</p>
      {loading && <p className="empty-state">Loading community reports…</p>}
      {error && (
        <div className="empty-state error-state" role="alert">
          <p>{error}</p>
          <button className="text-button" onClick={onRetry}>
            <RefreshCw size={14} />
            Retry reports
          </button>
        </div>
      )}
      {!loading && !error && !reports.length && (
        <div className="empty-state">
          <MessageSquare size={25} />
          <strong>No reports in this view</strong>
          <p>
            See a local problem? Add the first report to help your community.
          </p>
        </div>
      )}
      {truncated && (
        <p className="inline-error">
          Showing the latest 500. Zoom in to see a smaller area.
        </p>
      )}
      {reports.map((r) => (
        <button
          key={r.id}
          className="report-list-item"
          onClick={() => onSelect(r)}
        >
          <span className={'category-symbol ' + r.category}>
            <MapPin size={16} />
          </span>
          <span className="report-list-copy">
            <small>
              {categoryLabels[r.category]} · {relativeTime(r.createdAt)}
            </small>
            <strong>{r.title}</strong>
            <span>
              {r.confirmations}{' '}
              {r.confirmations === 1 ? 'confirmation' : 'confirmations'}
            </span>
          </span>
          <ArrowUpRight size={15} />
        </button>
      ))}
    </section>
  );
}
