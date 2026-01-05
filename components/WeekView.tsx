'use client';

import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import { CalendarEvent } from './CalendarEvent';
import { Appointment } from '@/lib/types';

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  appointmentsByDate: Record<string, Appointment[]>;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export function WeekView({
  currentDate,
  appointments,
  appointmentsByDate,
  onAppointmentClick,
}: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Show hours 07:00-19:00
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7, 8, 9, ..., 19

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  };

  const getAppointmentsForHour = (date: Date, hour: number): Appointment[] => {
    const dayAppointments = getAppointmentsForDate(date);
    return dayAppointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate.getHours() === hour;
    });
  };

  return (
    <div className="bg-white rounded-lg border overflow-x-auto">
      <div className="min-w-full sm:min-w-[800px]">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
          <div className="p-2 border-r"></div>
          {days.map((day) => {
            const isCurrentDay = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-r ${
                  isCurrentDay ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium text-gray-600">
                  {format(day, 'EEEE', { locale: hu })}
                </div>
                <div
                  className={`text-lg font-bold ${
                    isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(day, 'MMM', { locale: hu })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-8">
          {/* Hour labels */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b p-1 text-xs text-gray-500 text-right pr-2"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => (
            <div key={day.toISOString()} className="border-r">
              {hours.map((hour) => {
                const hourAppointments = getAppointmentsForHour(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="h-16 border-b p-1"
                  >
                    {hourAppointments.map((appointment) => (
                      <CalendarEvent
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => onAppointmentClick?.(appointment)}
                        compact
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

