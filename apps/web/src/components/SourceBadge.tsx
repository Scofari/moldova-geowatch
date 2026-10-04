import type { DataSource } from '@geowatch/shared';
export function SourceBadge({ mode }: { mode: DataSource['mode'] }) {
  return (
    <span className={'source-badge ' + mode.toLowerCase()}>
      {mode === 'LIVE' && <span className="status-dot" />}
      {mode}
    </span>
  );
}
