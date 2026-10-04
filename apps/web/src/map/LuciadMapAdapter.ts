import type {
  CommunityReport,
  GeoPosition,
  RiverFeature,
  WeatherPoint,
} from '@geowatch/shared';
import type { MapAdapter, MapLayer, MapOptions } from './MapAdapter';
declare global {
  interface Window {
    createLicensedLuciadAdapter?: (options: MapOptions) => MapAdapter;
  }
}
/**
 * Legal integration boundary: a customer-supplied module registers a real
 * LuciadRIA MapAdapter after loading its authorized SDK and license.
 * No SDK or license is distributed by this repository.
 */
export class LuciadMapAdapter implements MapAdapter {
  private delegate?: MapAdapter;
  constructor(private readonly options: MapOptions) {}
  async initialize(container: HTMLElement) {
    if (!window.createLicensedLuciadAdapter)
      throw new Error(
        'LuciadRIA is not configured. Install an authorized SDK, license and private integration, or use VITE_MAP_PROVIDER=oss.',
      );
    this.delegate = window.createLicensedLuciadAdapter(this.options);
    await this.delegate.initialize(container);
  }
  destroy() {
    this.delegate?.destroy();
  }
  setCenter(p: GeoPosition) {
    this.delegate?.setCenter(p);
  }
  setZoom(z: number) {
    this.delegate?.setZoom(z);
  }
  resetView() {
    this.delegate?.resetView();
  }
  addWeatherPoints(p: WeatherPoint[]) {
    this.delegate?.addWeatherPoints(p);
  }
  addRiverFeatures(f: RiverFeature[]) {
    this.delegate?.addRiverFeatures(f);
  }
  addReports(r: CommunityReport[]) {
    this.delegate?.addReports(r);
  }
  setLayerVisibility(l: MapLayer, v: boolean) {
    this.delegate?.setLayerVisibility(l, v);
  }
  setPicking(v: boolean) {
    this.delegate?.setPicking(v);
  }
  showPickedPosition(p: GeoPosition | null) {
    this.delegate?.showPickedPosition(p);
  }
}
