'use client';

import { X } from 'lucide-react';

interface CalendarFiltersProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onClear: () => void;
}

export function CalendarFilters({
  selectedStatus,
  onStatusChange,
  onClear,
}: CalendarFiltersProps) {
  const hasFilters = selectedStatus;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selectedStatus || ''}
        onChange={(e) => onStatusChange(e.target.value || null)}
        className="form-input text-sm py-1.5"
      >
        <option value="">Összes státusz</option>
        <option value="completed">Teljesült</option>
        <option value="cancelled_by_doctor">Lemondva (orvos)</option>
        <option value="cancelled_by_patient">Lemondva (beteg)</option>
        <option value="no_show">Nem jelent meg</option>
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Szűrők törlése
        </button>
      )}
    </div>
  );
}

