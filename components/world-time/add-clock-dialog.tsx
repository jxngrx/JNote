'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as Dialog from '@radix-ui/react-dialog';
import { Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  formatClockTime,
  getTimezoneOptionsForCountry,
  getUtcOffsetLabel,
  type TimezoneOption,
} from '@/lib/country-timezones';
import type { GlobeCountrySelection } from '@/components/world-time/globe-picker';

const GlobePicker = dynamic(
  () =>
    import('@/components/world-time/globe-picker').then((m) => ({
      default: m.GlobePicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="wt-globe-loading">
        <Globe size={28} className="wt-globe-loading-icon" />
        <span>Loading globe…</span>
      </div>
    ),
  }
);

export type ClockAddPayload = {
  countryId: string;
  countryName: string;
  timezone: string;
};

type AddClockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: ClockAddPayload) => boolean;
  existingClocks: ClockAddPayload[];
  slotsRemaining: number;
};

export function AddClockDialog({
  open,
  onOpenChange,
  onAdd,
  existingClocks,
  slotsRemaining,
}: AddClockDialogProps) {
  const [selection, setSelection] = useState<GlobeCountrySelection | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [previewNow, setPreviewNow] = useState(() => new Date());

  const timezoneOptions: TimezoneOption[] = useMemo(
    () => (selection ? getTimezoneOptionsForCountry(selection.id) : []),
    [selection]
  );

  const hasMultiTimezones = timezoneOptions.length > 1;

  const activeTimezone =
    selectedTimezone ??
    (timezoneOptions.length === 1 ? timezoneOptions[0].timezone : null);

  useEffect(() => {
    if (!open) {
      setSelection(null);
      setSelectedTimezone(null);
      return;
    }
    const id = window.setInterval(() => setPreviewNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!selection) {
      setSelectedTimezone(null);
      return;
    }
    const options = getTimezoneOptionsForCountry(selection.id);
    setSelectedTimezone(options.length === 1 ? options[0].timezone : null);
  }, [selection]);

  const isDuplicate =
    selection !== null &&
    activeTimezone !== null &&
    existingClocks.some(
      (c) => c.countryId === selection.id && c.timezone === activeTimezone
    );

  const selectedOption = timezoneOptions.find(
    (o) => o.timezone === activeTimezone
  );

  const showSelectionPanel =
    (selection && activeTimezone && selectedOption) ||
    !selection ||
    !hasMultiTimezones;

  const handleAdd = () => {
    if (!selection || !activeTimezone) return;
    const added = onAdd({
      countryId: selection.id,
      countryName: selection.name,
      timezone: activeTimezone,
    });
    if (added) onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="wt-dialog-overlay" />
        <Dialog.Content
          className={`wt-dialog-content${hasMultiTimezones ? ' wt-dialog-content--multi' : ''}`}
          aria-describedby={undefined}
        >
          <div className="wt-dialog-header">
            <div>
              <Dialog.Title className="wt-dialog-title">Add clock</Dialog.Title>
              <p className="wt-dialog-sub">
                Rotate globe · click country · {slotsRemaining} slot
                {slotsRemaining === 1 ? '' : 's'} left
              </p>
            </div>
            <Button
              variant="icon"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </div>

          <div className="wt-dialog-body">
            <div className="wt-globe-wrap">
              <GlobePicker
                active={open}
                selectedCountryId={selection?.id}
                onCountrySelect={setSelection}
                className="wt-globe-chart"
              />
              <p className="wt-globe-hint">
                Drag to rotate · scroll or +/- to zoom · click country
              </p>
            </div>

            {selection && hasMultiTimezones && (
              <div className="wt-timezone-picker">
                <p className="page-label wt-timezone-picker-head">
                  Time zone · {selection.name}
                </p>
                <ScrollArea
                  className="wt-timezone-scroll"
                  type="always"
                  fill
                >
                  <div
                    className="wt-timezone-list"
                    role="listbox"
                    aria-label={`Time zones in ${selection.name}`}
                  >
                    {timezoneOptions.map((option) => {
                      const isActive = activeTimezone === option.timezone;
                      const isTaken = existingClocks.some(
                        (c) =>
                          c.countryId === selection.id &&
                          c.timezone === option.timezone
                      );
                      const offset = getUtcOffsetLabel(
                        option.timezone,
                        previewNow
                      );
                      return (
                        <button
                          key={option.timezone}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          disabled={isTaken}
                          className={`wt-timezone-option${isActive ? ' active' : ''}${isTaken ? ' taken' : ''}`}
                          onClick={() => setSelectedTimezone(option.timezone)}
                        >
                          <span className="wt-timezone-option-label">
                            {option.label}
                          </span>
                          <time className="wt-timezone-option-time">
                            {formatClockTime(option.timezone, previewNow)}
                          </time>
                          <span className="wt-timezone-option-meta">
                            {offset}
                            {isTaken ? ' · added' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {showSelectionPanel && (
            <div className="wt-selection-panel">
              {selection && activeTimezone && selectedOption ? (
                <>
                  <div className="wt-selection-info">
                    <span className="wt-selection-label">Selected</span>
                    <strong className="wt-selection-country">
                      {selection.name}
                      {hasMultiTimezones ? ` · ${selectedOption.label}` : ''}
                    </strong>
                    <span className="wt-selection-zone">
                      {getUtcOffsetLabel(activeTimezone, previewNow)}
                    </span>
                  </div>
                  <time className="wt-selection-time">
                    {formatClockTime(activeTimezone, previewNow)}
                  </time>
                </>
              ) : (
                <p className="wt-selection-empty">Pick a country on the globe</p>
              )}
            </div>
          )}

          {isDuplicate && (
            <p className="wt-dialog-error">
              This time zone is already on your board.
            </p>
          )}

          <div className="wt-dialog-actions">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selection || !activeTimezone || isDuplicate}
              onClick={handleAdd}
            >
              Add clock
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
