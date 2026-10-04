import { CloudSun, Waves, MessageSquare, ArrowUpRight } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
interface Props {
  weatherCount: number;
  cityCount: number;
  weatherFailed: boolean;
  reportCount: number;
  truncated?: boolean;
  riverError: boolean;
  onRiver(): void;
}
export function OverviewCards({
  weatherCount,
  cityCount,
  weatherFailed,
  reportCount,
  truncated,
  riverError,
  onRiver,
}: Props) {
  return (
    <div className="overview-cards">
      <div className="overview-card">
        <span className="overview-icon weather">
          <CloudSun size={23} />
        </span>
        <div>
          <span className="card-label">WEATHER LOCATIONS</span>
          <strong>
            {weatherCount}
            <small> / {cityCount || '—'}</small>
          </strong>
          <span className="card-caption">
            {weatherFailed
              ? 'Some weather requests failed'
              : weatherCount
                ? 'Current modeled conditions'
                : 'Waiting for weather data'}
          </span>
        </div>
        {weatherCount > 0 && <SourceBadge mode="LIVE" />}
      </div>
      <button className="overview-card" onClick={() => onRiver()}>
        <span className="overview-icon rivers">
          <Waves size={23} />
        </span>
        <div>
          <span className="card-label">RIVER NETWORK</span>
          <strong>
            Nistru <small>&</small> Prut
          </strong>
          <span className="card-caption">
            {riverError
              ? 'River service unavailable'
              : 'Real geometry · sample readings'}
          </span>
        </div>
        <SourceBadge mode="DEMO" />
      </button>
      <div className="overview-card">
        <span className="overview-icon reports">
          <MessageSquare size={22} />
        </span>
        <div>
          <span className="card-label">COMMUNITY REPORTS</span>
          <strong>
            {reportCount}
            {truncated ? '+' : ''}
            <small> in view</small>
          </strong>
          <span className="card-caption">Shared by the community</span>
        </div>
        <span className="card-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </div>
  );
}
