import { Topbar } from '../components/Topbar';
import { OverviewCards } from '../components/OverviewCards';
import { Sidebar } from '../components/Sidebar';
import { DataSourcesDialog } from '../components/DataSourcesDialog';
import { MapWorkspace } from '../features/map/MapWorkspace';
import { useCallback, useRef, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Plus, ArrowUpRight, Github, Info } from 'lucide-react';
import {
  countries,
  type ReportCategory,
  type GeoPosition,
} from '@geowatch/shared';
import { api } from '../api/client';
import type { MapAdapter, MapLayer, MapSelection } from '../map/MapAdapter';
import { useReports } from '../hooks/useReports';
const country = countries.MD!;
const noReports: never[] = [];
export function App() {
  const map = useRef<MapAdapter | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [category, setCategory] = useState<ReportCategory | 'all'>('all');
  const [visibility, setVisibility] = useState<Record<MapLayer, boolean>>({
    weather: true,
    rivers: true,
    reports: true,
  });
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(
    null,
  );
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [reporting, setReporting] = useState(false);
  const [picked, setPicked] = useState<GeoPosition | null>(null);
  const [notice, setNotice] = useState('');
  const [showSources, setShowSources] = useState(false);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 30_000,
  });
  const geography = useQuery({
    queryKey: ['geography', country.code],
    queryFn: () => api.geography(country.code),
    staleTime: Infinity,
  });
  const rivers = useQuery({
    queryKey: ['rivers', country.code],
    queryFn: () => api.rivers(country.code),
    staleTime: 60 * 60_000,
  });
  const reportQuery = useReports(country.code, category, bbox);
  const cities = geography.data?.cities.slice(0, 8) ?? [];
  const weatherQueries = useQueries({
    queries: cities.map((city) => ({
      queryKey: ['weather', city.position],
      queryFn: () => api.weather(city.position),
      staleTime: 5 * 60_000,
      refetchInterval: 5 * 60_000,
    })),
  });
  const weather = weatherQueries.flatMap((q, i) =>
    q.data ? [{ ...q.data, name: cities[i]?.name }] : [],
  );
  const weatherFailed = weatherQueries.some((q) => q.isError);
  const reports = reportQuery.data?.reports ?? noReports;
  const selectedReport =
    selection?.type === 'report'
      ? reports.find((r) => r.id === selection.data.id)
      : null;
  const currentSelection = selectedReport
    ? { type: 'report' as const, data: selectedReport }
    : selection;
  const closeReport = useCallback(() => {
    setReporting(false);
    setPicked(null);
  }, []);
  function startReport() {
    setNotice('');
    setReporting(true);
    setDrawer(false);
    setSelection(null);
    setPicked(null);
  }
  function choose(selection: MapSelection) {
    setSelection(selection);
    setDrawer(false);
    setReporting(false);
    setPicked(null);
  }
  return (
    <div className="app-shell">
      <Topbar
        countryCode={country.code}
        health={health}
        onSources={() => setShowSources(true)}
        onLocation={(r) => {
          map.current?.setCenter(r.position);
          map.current?.setZoom(12);
          setNotice('Viewing ' + r.name);
        }}
      />
      <div className="workspace">
        {drawer && (
          <button
            className="drawer-backdrop"
            onClick={() => setDrawer(false)}
            aria-label="Close layers panel"
          />
        )}
        <Sidebar
          drawer={drawer}
          visibility={visibility}
          category={category}
          reportQuery={reportQuery}
          reports={reports}
          onLayerToggle={(layer, value) =>
            setVisibility((current) => ({ ...current, [layer]: value }))
          }
          onCategory={setCategory}
          onSelect={(report) => {
            map.current?.setCenter(report.position);
            choose({ type: 'report', data: report });
          }}
          onCreate={startReport}
          onRiver={() => {
            const river = rivers.data?.features[0];
            if (river) choose({ type: 'river', data: river });
          }}
          onSources={() => setShowSources(true)}
          onClose={() => setDrawer(false)}
        />
        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="little-line" />
                REGIONAL OVERVIEW
              </div>
              <h1>
                A clearer view of Moldova<span>.</span>
              </h1>
              <p>
                Explore the weather, follow our rivers, and see what’s happening
                nearby.
              </p>
            </div>
            <button
              className="outline-button desktop-report"
              onClick={startReport}
            >
              <Plus size={17} />
              Add report
            </button>
          </div>
          <OverviewCards
            weatherCount={weather.length}
            cityCount={cities.length}
            weatherFailed={weatherFailed}
            reportCount={reports.length}
            truncated={reportQuery.data?.truncated}
            riverError={rivers.isError}
            onRiver={() => {
              const river = rivers.data?.features[0];
              if (river) choose({ type: 'river', data: river });
            }}
          />
          <MapWorkspace
            country={country}
            geography={geography}
            rivers={rivers}
            weather={weather}
            reports={reports}
            visibility={visibility}
            reporting={reporting}
            picked={picked}
            currentSelection={currentSelection}
            notice={notice}
            connected={reportQuery.connected}
            map={map}
            onDrawer={() => setDrawer(true)}
            onSelect={choose}
            onPicked={setPicked}
            onViewport={setBbox}
            onCloseReport={closeReport}
            onCloseSelection={() => setSelection(null)}
            onNotice={setNotice}
          />
          <div className="data-note">
            <Info size={15} />
            <p>
              Open data, clear origins. Weather comes from models; water-level
              readings are labeled demo. Community reports are unverified.
            </p>
            <button
              className="text-button"
              onClick={() => setShowSources(true)}
            >
              About the data
              <ArrowUpRight size={14} />
            </button>
          </div>
          {(weatherFailed || rivers.isError) && (
            <div className="provider-errors" role="alert">
              {weatherFailed && (
                <span>
                  Weather is partially unavailable.{' '}
                  <button
                    className="text-button"
                    onClick={() =>
                      weatherQueries.forEach((q) => {
                        void q.refetch();
                      })
                    }
                  >
                    Retry weather
                  </button>
                </span>
              )}
              {rivers.isError && (
                <span>
                  River data could not load.{' '}
                  <button
                    className="text-button"
                    onClick={() => {
                      void rivers.refetch();
                    }}
                  >
                    Retry rivers
                  </button>
                </span>
              )}
            </div>
          )}
          <footer className="page-footer">
            <span>
              MOLDOVA GEOWATCH <small> / v0.1</small>
            </span>
            <span>
              Built with open data and community insight <Github size={14} />
            </span>
          </footer>
        </main>
      </div>
      <button className="mobile-report primary-button" onClick={startReport}>
        <Plus size={18} />
        Report problem
      </button>
      {showSources && (
        <DataSourcesDialog
          geography={geography.data}
          onClose={() => setShowSources(false)}
        />
      )}
    </div>
  );
}
