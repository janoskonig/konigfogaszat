'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  selected,
  onChange,
  minDate,
  placeholder = 'Válasszon dátumot és időt',
  className = '',
}: DateTimePickerProps) {
  const [dateValue, setDateValue] = useState(
    selected ? format(selected, 'yyyy-MM-dd') : ''
  );
  const [timeValue, setTimeValue] = useState(
    selected ? format(selected, 'HH:mm') : ''
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setDateValue(dateStr);
    
    if (dateStr && timeValue) {
      const newDate = new Date(`${dateStr}T${timeValue}`);
      onChange(newDate);
    } else if (dateStr) {
      // If only date is set, use current time or 09:00
      const newDate = new Date(`${dateStr}T09:00`);
      onChange(newDate);
    } else {
      onChange(null);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value;
    setTimeValue(timeStr);
    
    if (dateValue && timeStr) {
      const newDate = new Date(`${dateValue}T${timeStr}`);
      onChange(newDate);
    } else if (dateValue) {
      // If only date is set, use 09:00
      const newDate = new Date(`${dateValue}T09:00`);
      onChange(newDate);
    }
  };

  const minDateStr = minDate ? format(minDate, 'yyyy-MM-dd') : undefined;
  const minTimeStr = minDate && dateValue === format(minDate, 'yyyy-MM-dd') 
    ? format(minDate, 'HH:mm') 
    : undefined;

  return (
    <div className={`flex gap-2 ${className}`}>
      <input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        min={minDateStr}
        className="form-input flex-1"
        placeholder="Dátum"
      />
      <input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        min={minTimeStr}
        className="form-input flex-1"
        placeholder="Idő"
      />
    </div>
  );
}

