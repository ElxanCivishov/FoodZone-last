import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import type L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, X, Navigation, Check, Loader2 } from 'lucide-react';
import { SPRING } from '@/utils/motion';
import { useT } from '@/hooks/useT';

const BAKU: [number, number] = [40.4093, 49.8671];

interface PickedLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (loc: PickedLocation) => void;
  initialCenter?: [number, number];
}

async function reverseGeocode(lat: number, lng: number): Promise<PickedLocation> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=az,en`,
    { headers: { 'Accept-Language': 'az,en' } }
  );
  if (!res.ok) return { lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: '' };
  const d = await res.json();
  const a = d.address || {};
  const street = [a.road || a.pedestrian || a.street || a.footway, a.house_number]
    .filter(Boolean).join(' ');
  const suburb = a.suburb || a.neighbourhood || '';
  const city = a.city || a.town || a.village || '';
  const address = [street, suburb].filter(Boolean).join(', ') || d.display_name?.split(',')[0] || '';
  return { lat, lng, address, city };
}

function MapRefBridge({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  mapRef.current = useMap();
  return null;
}

function MoveEndHandler({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMove(c.lat, c.lng);
    },
    zoomend(e) {
      const c = e.target.getCenter();
      onMove(c.lat, c.lng);
    },
  });
  return null;
}

export default function MapPickerModal({ open, onClose, onConfirm, initialCenter }: Props) {
  const t = useT();
  const mapRef = useRef<L.Map | null>(null);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleMove = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setPicked(result);
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoLoading(false);
        mapRef.current?.flyTo([coords.latitude, coords.longitude], 17, { duration: 1 });
      },
      () => setGeoLoading(false),
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    if (!picked) return;
    onConfirm(picked);
    onClose();
  };

  if (!open) return null;

  const container = document.getElementById('app-root') ?? document.body;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={SPRING}
      className="absolute inset-0 z-[9999] flex flex-col bg-white"
    >
      {/* Header */}
      <div className="relative px-4 pt-12 pb-3 border-b border-border-light flex items-center gap-3 shrink-0 bg-white">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center shrink-0"
        >
          <X size={18} className="text-text-primary" />
        </motion.button>
        <div className="flex-1">
          <h2 className="font-outfit text-[17px] font-bold text-text-primary">{t.map.title}</h2>
          <p className="text-text-tertiary text-[11px]">{t.map.subtitle}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleCurrentLocation}
          disabled={geoLoading}
          className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center shrink-0"
        >
          {geoLoading
            ? <Loader2 size={16} className="text-primary animate-spin" />
            : <Navigation size={16} className="text-primary" />}
        </motion.button>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={initialCenter ?? BAKU}
          zoom={15}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapRefBridge mapRef={mapRef} />
          <MoveEndHandler onMove={handleMove} />
        </MapContainer>

        {/* Fixed crosshair pin */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
          <div className="flex flex-col items-center" style={{ transform: 'translateY(-50%)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
            >
              <MapPin size={20} className="text-white" />
            </div>
            {/* Pin tail */}
            <div className="w-1 h-3 bg-primary rounded-full opacity-70" />
            {/* Shadow dot */}
            <div className="w-3 h-1 bg-black/20 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Geocoding overlay */}
        {geocoding && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[401] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
            <Loader2 size={12} className="text-primary animate-spin" />
            <span className="text-[11px] font-medium text-text-secondary">{t.map.findingAddress}</span>
          </div>
        )}
      </div>

      {/* Bottom confirm sheet */}
      <div className="bg-white px-4 pt-3 pb-6 border-t border-border-light shrink-0">
        <div className="flex items-start gap-2.5 mb-3 min-h-[36px]">
          <div className="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={13} className="text-primary" />
          </div>
          <p className="text-[13px] text-text-primary leading-relaxed line-clamp-2 flex-1">
            {geocoding
              ? <span className="text-text-tertiary">{t.map.searchingAddress}</span>
              : picked?.address
                ? picked.address
                : <span className="text-text-tertiary">{t.map.moveMap}</span>}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={!picked || geocoding}
          className="w-full h-12 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#00c2e8,#00c2a8)' }}
        >
          <Check size={16} />
          {t.map.selectPlace}
        </motion.button>
      </div>
    </motion.div>,
    container
  );
}
