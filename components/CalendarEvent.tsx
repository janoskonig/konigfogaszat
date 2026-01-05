'use client';

import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Appointment } from '@/lib/types';

interface CalendarEventProps {
  appointment: Appointment;
  onClick?: () => void;
  compact?: boolean;
}

export function CalendarEvent({ appointment, onClick, compact = false }: CalendarEventProps) {
  const startTime = new Date(appointment.startTime);
  const isPast = startTime < new Date();
  
  const getStatusColor = () => {
    if (appointment.isLate) return 'bg-orange-100 border-orange-300 text-orange-800';
    if (appointment.appointmentStatus === 'completed') return 'bg-green-100 border-green-300 text-green-800';
    if (appointment.appointmentStatus === 'cancelled_by_doctor' || appointment.appointmentStatus === 'cancelled_by_patient') {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    if (appointment.appointmentStatus === 'no_show') return 'bg-gray-100 border-gray-300 text-gray-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`text-xs p-1 rounded border ${getStatusColor()} cursor-pointer hover:opacity-80 ${
          isPast ? 'opacity-60' : ''
        }`}
        title={appointment.patientName || 'Név nélküli'}
      >
        <div className="font-medium truncate">
          {appointment.patientName || 'Név nélküli'}
        </div>
        <div className="text-xs opacity-75">
          {format(startTime, 'HH:mm', { locale: hu })}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-2 rounded border ${getStatusColor()} cursor-pointer hover:opacity-80 ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      <div className="font-medium text-sm">
        {appointment.patientName || 'Név nélküli'}
      </div>
      <div className="text-xs opacity-75 mt-1">
        {format(startTime, 'HH:mm', { locale: hu })}
      </div>
      {appointment.dentistName && (
        <div className="text-xs opacity-75 mt-1">
          {appointment.dentistName}
        </div>
      )}
    </div>
  );
}

