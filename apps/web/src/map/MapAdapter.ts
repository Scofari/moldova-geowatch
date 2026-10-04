import type {
  CommunityReport,
  CountryConfig,
  CountryGeography,
  GeoPosition,
  RiverFeature,
  WeatherPoint,
} from '@geowatch/shared';
export type MapLayer = 'weather' | 'rivers' | 'reports';
export type MapSelection =
  | { type: 'weather'; data: WeatherPoint }
  | { type: 'river'; data: RiverFeature }
  | { type: 'report'; data: CommunityReport };
export interface MapCallbacks {
  onSelect(selection: MapSelection): void;
  onPosition(position: GeoPosition): void;
  onViewport(bbox: [number, number, number, number]): void;
}
export interface MapAdapter {
  initialize(container: HTMLElement): Promise<void>;
  destroy(): void;
  setCenter(position: GeoPosition): void;
  setZoom(zoom: number): void;
  addWeatherPoints(points: WeatherPoint[]): void;
  addRiverFeatures(features: RiverFeature[]): void;
  addReports(reports: CommunityReport[]): void;
  setLayerVisibility(layer: MapLayer, visible: boolean): void;
  setPicking(enabled: boolean): void;
  showPickedPosition(position: GeoPosition | null): void;
  resetView(): void;
}
export interface MapOptions {
  country: CountryConfig;
  geography: CountryGeography;
  callbacks: MapCallbacks;
}
