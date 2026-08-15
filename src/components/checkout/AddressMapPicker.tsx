import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPinned, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [36.8065, 10.1815]; // Tunis
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
};

const pinIcon = L.divIcon({
  className: 'address-map-pin',
  html: '<span class="address-map-pin__glyph"></span>',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -36],
});

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '0');

  const response = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
  });
  if (!response.ok) return null;
  const data = (await response.json()) as NominatimResult;
  return data.display_name?.trim() || null;
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '0');

  const response = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
  });
  if (!response.ok) return [];
  return (await response.json()) as NominatimResult[];
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({
  position,
  zoom = 15,
}: {
  position: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom, { animate: true });
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [map, position, zoom]);
  return null;
}

function FixMapSize({ revision }: { revision: number }) {
  const map = useMap();
  useEffect(() => {
    const delays = [0, 80, 200, 400];
    const timers = delays.map((ms) =>
      window.setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, ms),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [map, revision]);
  return null;
}

interface AddressMapPickerProps {
  id?: string;
  value: string;
  onChange: (address: string) => void;
  required?: boolean;
}

export function AddressMapPicker({
  id = 'checkout-address',
  value,
  onChange,
  required = true,
}: AddressMapPickerProps) {
  const [open, setOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapRevision, setMapRevision] = useState(0);
  const [position, setPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [draftAddress, setDraftAddress] = useState(value);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState(
    'Search, click the map, or drag the pin to choose a location.',
  );
  const [hasPinned, setHasPinned] = useState(false);
  const searchTimer = useRef<number | null>(null);

  async function applyCoordinates(lat: number, lng: number) {
    setBusy(true);
    setHint('Resolving address...');
    setPosition([lat, lng]);
    setHasPinned(true);
    setSuggestions([]);
    setMapRevision((current) => current + 1);
    try {
      const address = await reverseGeocode(lat, lng);
      if (address) {
        setDraftAddress(address);
        setSearch(address);
        setHint('Location selected. Click “Use this address” to confirm.');
      } else {
        setHint('Could not resolve this point. Adjust the pin or search again.');
      }
    } catch {
      setHint('Could not resolve this point. Adjust the pin or search again.');
    } finally {
      setBusy(false);
    }
  }

  const markerEventHandlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        const marker = event.target as L.Marker;
        const next = marker.getLatLng();
        void applyCoordinates(next.lat, next.lng);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!open) {
      setMapReady(false);
      return;
    }

    setDraftAddress(value);
    setSearch(value.trim());
    setSuggestions([]);
    setHint('Search, click the map, or drag the pin to choose a location.');
    setMapRevision((current) => current + 1);

    // Wait a frame so the modal layout has real height before mounting the map.
    const timer = window.setTimeout(() => setMapReady(true), 40);

    const initial = value.trim();
    if (initial.length >= 5) {
      void (async () => {
        try {
          const results = await searchAddress(initial);
          if (!results[0]?.lat || !results[0]?.lon) return;
          setPosition([Number(results[0].lat), Number(results[0].lon)]);
          setHasPinned(true);
          setMapRevision((current) => current + 1);
        } catch {
          // Keep default center.
        }
      })();
    }

    return () => window.clearTimeout(timer);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }

    const query = search.trim();
    if (query.length < 3 || query === draftAddress.trim()) {
      setSuggestions([]);
      return;
    }

    searchTimer.current = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchAddress(query);
          setSuggestions(results.filter((item) => item.lat && item.lon));
        } catch {
          setSuggestions([]);
        }
      })();
    }, 450);

    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
      }
    };
  }, [search, draftAddress, open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function chooseSuggestion(item: NominatimResult) {
    if (!item.lat || !item.lon) return;
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    setSuggestions([]);
    setSearch(item.display_name ?? search);
    if (item.display_name) setDraftAddress(item.display_name);
    setPosition([lat, lng]);
    setHasPinned(true);
    setMapRevision((current) => current + 1);
    setHint('Location selected. Click “Use this address” to confirm.');
  }

  function confirmAddress() {
    const next = draftAddress.trim();
    if (next.length < 5) {
      setHint('Pick a location on the map or enter a fuller address.');
      return;
    }
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="address-map-picker">
      <div className="form-group">
        <div className="address-map-picker__label-row">
          <label htmlFor={id}>Delivery address</label>
          <button
            type="button"
            className="btn btn-secondary address-map-picker__open-btn"
            onClick={() => setOpen(true)}
          >
            <MapPinned size={16} strokeWidth={2} />
            Map
          </button>
        </div>
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Street, city, governorate... or pick on the map"
          required={required}
          minLength={5}
        />
      </div>

      {open && (
        <div
          className="address-map-modal-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="address-map-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-map-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="address-map-modal__header">
              <div>
                <h2 id="address-map-modal-title">Choose delivery location</h2>
                <p>Search, click the map, or drag the pin.</p>
              </div>
              <button
                type="button"
                className="address-map-modal__close"
                onClick={() => setOpen(false)}
                aria-label="Close map"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="address-map-modal__search form-group">
              <label htmlFor={`${id}-search`}>Search</label>
              <input
                id={`${id}-search`}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search street, city, or landmark..."
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="address-map-picker__suggestions">
                  {suggestions.map((item) => (
                    <li key={`${item.lat}-${item.lon}-${item.display_name}`}>
                      <button
                        type="button"
                        onClick={() => chooseSuggestion(item)}
                      >
                        {item.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="address-map-modal__map">
              {mapReady ? (
                <MapContainer
                  key={`checkout-map-${mapRevision > 0 ? 'ready' : 'init'}`}
                  center={position}
                  zoom={hasPinned ? 15 : 12}
                  scrollWheelZoom
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <FixMapSize revision={mapRevision} />
                  <MapClickHandler
                    onPick={(lat, lng) => {
                      void applyCoordinates(lat, lng);
                    }}
                  />
                  {hasPinned && (
                    <RecenterMap position={position} zoom={15} />
                  )}
                  <Marker
                    position={position}
                    draggable
                    icon={pinIcon}
                    eventHandlers={markerEventHandlers}
                  />
                </MapContainer>
              ) : (
                <div className="address-map-modal__map-loading">
                  Loading map...
                </div>
              )}
            </div>

            <p className="address-map-picker__hint">
              {busy ? 'Resolving address...' : hint}
            </p>

            <div className="form-group">
              <label htmlFor={`${id}-draft`}>Selected address</label>
              <textarea
                id={`${id}-draft`}
                rows={2}
                value={draftAddress}
                onChange={(event) => setDraftAddress(event.target.value)}
                placeholder="Address from the map will appear here"
              />
            </div>

            <div className="address-map-modal__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmAddress}
                disabled={busy || draftAddress.trim().length < 5}
              >
                Use this address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
