'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDentistAuthenticated, clearDentistSession } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init';
import { CalendarView } from '@/components/CalendarView';
import { TimeSlotsManager } from '@/components/TimeSlotsManager';
import { AppointmentBooking } from '@/components/AppointmentBooking';
import { Logo } from '@/components/Logo';
import { LogOut, Calendar, Clock, UserPlus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Appointment } from '@/lib/types';

type ViewType = 'calendar' | 'time-slots' | 'appointments';

function SchedulerContent() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await initializeDatabase();
        if (!isDentistAuthenticated()) {
          router.push('/');
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    clearDentistSession();
    router.push('/');
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 md:py-4">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Logo width={40} height={46} className="md:w-[80px] md:h-[92px] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-2xl font-bold text-medical-primary truncate">
                  König Fogászat
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5 hidden sm:block">
                  Időpontkezelő
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`btn-secondary flex items-center gap-2 ${
                    currentView === 'calendar' ? 'bg-blue-100' : ''
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Naptár
                </button>
                <button
                  onClick={() => setCurrentView('time-slots')}
                  className={`btn-secondary flex items-center gap-2 ${
                    currentView === 'time-slots' ? 'bg-blue-100' : ''
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Időpontok
                </button>
                <button
                  onClick={() => setCurrentView('appointments')}
                  className={`btn-secondary flex items-center gap-2 ${
                    currentView === 'appointments' ? 'bg-blue-100' : ''
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Foglalás
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Kijelentkezés
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'calendar' && (
          <CalendarView onAppointmentClick={handleAppointmentClick} />
        )}
        {currentView === 'time-slots' && <TimeSlotsManager />}
        {currentView === 'appointments' && <AppointmentBooking />}
      </main>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 md:p-4 z-50"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="bg-white rounded-none md:rounded-lg max-w-md w-full h-full md:h-auto max-h-[100vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Időpont részletei</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Beteg neve</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedAppointment.patientName || 'Név nélküli'}
                </p>
              </div>

              {selectedAppointment.patientTaj && (
                <div>
                  <label className="text-xs font-medium text-gray-500">TAJ szám</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedAppointment.patientTaj}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500">Időpont</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedAppointment.startTime).toLocaleString('hu-HU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {selectedAppointment.dentistName && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Orvos</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedAppointment.dentistName}
                  </p>
                </div>
              )}

              {selectedAppointment.cim && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Cím</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedAppointment.cim}
                    {selectedAppointment.teremszam && ` (Terem: ${selectedAppointment.teremszam})`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulerPage() {
  return <SchedulerContent />;
}

