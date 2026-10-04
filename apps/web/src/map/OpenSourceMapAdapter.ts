import L from 'leaflet';
import type {
  CommunityReport,
  GeoPosition,
  RiverFeature,
  WeatherPoint,
} from '@geowatch/shared';
import type { MapAdapter, MapLayer, MapOptions } from './MapAdapter';
const latLng = (p: GeoPosition): L.LatLngExpression => [
  p.latitude,
  p.longitude,
];
const reportColors = {
  road: '#d29839',
  flood: '#428fb8',
  accident: '#d36c59',
  weather: '#80835b',
  infrastructure: '#9377a3',
  other: '#64796b',
};
export class OpenSourceMapAdapter implements MapAdapter {
  private map?: L.Map;
  private groups: Record<MapLayer, L.LayerGroup> = {
    weather: L.layerGroup(),
    rivers: L.layerGroup(),
    reports: L.layerGroup(),
  };
  private picking = false;
  private picked?: L.CircleMarker;
  private resize?: ResizeObserver;
  constructor(private readonly options: MapOptions) {}
  async initialize(container: HTMLElement) {
    const { country, geography, callbacks } = this.options;
    const map = L.map(container, {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: true,
    });
    this.map = map;
    map.setView(latLng(country.center), country.zoom);
    L.tileLayer(
      import.meta.env.VITE_TILE_URL ||
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
    L.geoJSON(geography.border, {
      style: {
        color: '#58765b',
        weight: 2,
        opacity: 0.8,
        fillColor: '#719574',
        fillOpacity: 0.035,
        dashArray: '5 5',
      },
      interactive: false,
    }).addTo(map);
    for (const city of geography.cities) {
      const label = document.createElement('span');
      label.textContent = city.name;
      L.circleMarker(latLng(city.position), {
        radius: 3,
        weight: 1.5,
        color: '#fff',
        fillColor: '#4f6255',
        fillOpacity: 1,
      })
        .bindTooltip(label, {
          permanent: true,
          direction: 'bottom',
          className: 'city-label',
        })
        .addTo(map);
    }
    Object.values(this.groups).forEach((g) => g.addTo(map));
    map.on('click', (event: L.LeafletMouseEvent) => {
      if (this.picking)
        callbacks.onPosition({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
    });
    const viewport = () => {
      const b = map.getBounds();
      callbacks.onViewport([
        Math.max(-180, b.getWest()),
        Math.max(-90, b.getSouth()),
        Math.min(180, b.getEast()),
        Math.min(90, b.getNorth()),
      ]);
    };
    map.on('moveend', viewport);
    viewport();
    this.resize = new ResizeObserver(() => map.invalidateSize());
    this.resize.observe(container);
  }
  destroy() {
    this.resize?.disconnect();
    this.map?.remove();
    this.map = undefined;
  }
  setCenter(p: GeoPosition) {
    this.map?.panTo(latLng(p));
  }
  setZoom(z: number) {
    this.map?.setZoom(z);
  }
  resetView() {
    this.map?.setView(
      latLng(this.options.country.center),
      this.options.country.zoom,
    );
  }
  addWeatherPoints(points: WeatherPoint[]) {
    this.groups.weather.clearLayers();
    for (const point of points) {
      const el = document.createElement('div');
      el.className = 'weather-pin';
      el.textContent = Math.round(point.temperature) + '°';
      const label =
        point.name +
        ': ' +
        point.temperature +
        ' degrees Celsius. Open weather details';
      const marker = L.marker(latLng(point.position), {
        icon: L.divIcon({
          html: el,
          className: 'weather-icon',
          iconSize: [46, 36],
          iconAnchor: [23, 38],
        }),
        title: label,
        alt: label,
      });
      marker.on('click', () => {
        if (this.picking) this.options.callbacks.onPosition(point.position);
        else this.options.callbacks.onSelect({ type: 'weather', data: point });
      });
      marker.addTo(this.groups.weather);
    }
  }
  addRiverFeatures(features: RiverFeature[]) {
    this.groups.rivers.clearLayers();
    for (const feature of features) {
      const line = L.geoJSON(feature, {
        style: {
          color: feature.properties.id === 'prut' ? '#5a9ea4' : '#488aac',
          weight: 3.5,
          opacity: 0.9,
        },
      });
      line.on('click', (event: L.LeafletMouseEvent) => {
        if (this.picking)
          this.options.callbacks.onPosition({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          });
        else this.options.callbacks.onSelect({ type: 'river', data: feature });
      });
      const tooltip = document.createElement('span');
      tooltip.textContent = feature.properties.name;
      line.bindTooltip(tooltip).addTo(this.groups.rivers);
    }
  }
  addReports(reports: CommunityReport[]) {
    this.groups.reports.clearLayers();
    for (const report of reports) {
      const el = document.createElement('div');
      el.className = 'report-pin';
      el.style.backgroundColor = reportColors[report.category];
      el.textContent = '!';
      const marker = L.marker(latLng(report.position), {
        icon: L.divIcon({
          html: el,
          className: 'report-icon',
          iconSize: [28, 28],
        }),
        title: report.title,
        alt: report.title,
      });
      marker.on('click', () => {
        if (this.picking) this.options.callbacks.onPosition(report.position);
        else this.options.callbacks.onSelect({ type: 'report', data: report });
      });
      marker.addTo(this.groups.reports);
    }
  }
  setLayerVisibility(layer: MapLayer, visible: boolean) {
    if (!this.map) return;
    if (visible) this.groups[layer].addTo(this.map);
    else this.groups[layer].remove();
  }
  setPicking(enabled: boolean) {
    this.picking = enabled;
    this.map?.getContainer().classList.toggle('picking', enabled);
  }
  showPickedPosition(p: GeoPosition | null) {
    this.picked?.remove();
    this.picked = undefined;
    if (p && this.map)
      this.picked = L.circleMarker(latLng(p), {
        radius: 10,
        color: '#143e36',
        fillColor: '#bbdf94',
        fillOpacity: 1,
        weight: 3,
      }).addTo(this.map);
  }
}
