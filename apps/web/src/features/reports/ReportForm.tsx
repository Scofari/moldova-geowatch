import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, MapPin, Send, MousePointer2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  categoryLabels,
  createReportSchema,
  type GeoPosition,
  type ReportCategory,
} from '@geowatch/shared';
import { api } from '../../api/client';
interface Props {
  country: string;
  position: GeoPosition | null;
  onPosition(p: GeoPosition): void;
  onClose(): void;
  onCreated(): void;
}
export function ReportForm({
  country,
  position,
  onPosition,
  onClose,
  onCreated,
}: Props) {
  const client = useQueryClient();
  const [category, setCategory] = useState<ReportCategory>('road');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validation, setValidation] = useState('');
  const [manualPosition, setManualPosition] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('keydown', handle);
      previous?.focus();
    };
  }, [onClose]);
  const mutation = useMutation({
    mutationFn: api.createReport,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['reports'] });
      onCreated();
    },
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    const data = createReportSchema.safeParse({
      countryCode: country,
      position,
      category,
      title,
      description,
    });
    if (!data.success) {
      setValidation(
        data.error.issues[0]?.message || 'Check your report details.',
      );
      return;
    }
    setValidation('');
    mutation.mutate(data.data);
  }
  return (
    <section
      className={
        'report-form floating-panel ' +
        (!position && !manualPosition ? 'awaiting-location' : '')
      }
      role="dialog"
      aria-modal="false"
      aria-labelledby="report-heading"
      tabIndex={-1}
      ref={dialog}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">COMMUNITY CONTRIBUTION</span>
          <h2 id="report-heading">Report a local problem</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close report form"
        >
          <X size={20} />
        </button>
      </div>
      <p className="form-intro">
        Help others understand what’s happening. Share only what you’ve
        observed.
      </p>
      <div className="pick-hint">
        <MousePointer2 size={18} />
        <span>
          {position
            ? 'Location selected. Click the map to change it.'
            : 'Click the map to choose a location, or enter coordinates below.'}
        </span>
      </div>
      {!position && !manualPosition && (
        <button
          className="text-button coordinate-entry-button"
          onClick={() => setManualPosition(true)}
        >
          Enter coordinates instead
        </button>
      )}
      <form onSubmit={submit}>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
          >
            {Object.entries(categoryLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Damaged road near the bridge"
            required
            minLength={5}
            maxLength={120}
          />
        </label>
        <label>
          Description <span className="optional">optional</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add useful details. Don’t include personal information."
            maxLength={1500}
            rows={3}
          />
        </label>
        <div className="coordinate-inputs">
          <label>
            Latitude
            <input
              type="number"
              step="any"
              required
              min={-90}
              max={90}
              value={position?.latitude ?? ''}
              onChange={(e) => {
                if (e.target.value)
                  onPosition({
                    latitude: Number(e.target.value),
                    longitude: position?.longitude ?? 28.65,
                  });
              }}
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              required
              min={-180}
              max={180}
              value={position?.longitude ?? ''}
              onChange={(e) => {
                if (e.target.value)
                  onPosition({
                    longitude: Number(e.target.value),
                    latitude: position?.latitude ?? 47.05,
                  });
              }}
            />
          </label>
        </div>
        <div className="location-readout">
          <MapPin size={14} />
          {position
            ? position.latitude.toFixed(5) +
              ', ' +
              position.longitude.toFixed(5)
            : 'No location selected'}
        </div>
        {(validation || mutation.isError) && (
          <p className="inline-error" role="alert">
            {validation || mutation.error?.message}
          </p>
        )}
        <p className="privacy-note">
          Reports are public and unverified. Your network address is used for
          rate limiting. No account required.
        </p>
        <button
          className="primary-button full-width"
          disabled={mutation.isPending || !position}
        >
          <Send size={16} />
          {mutation.isPending ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </section>
  );
}
