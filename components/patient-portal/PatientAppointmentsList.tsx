'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useToast } from '@/contexts/ToastContext';
import { BookingModal } from './BookingModal';
import { Appointment, TimeSlot } from '@/lib/types';
import { 
  getAppointmentsByPatient, 
  getAllTimeSlots, 
  addAppointment,
  updateTimeSlot,
  getPatient
} from '@/lib/storage';
import { getPatientPortalSession, verifyPatientPortalSession } from '@/lib/auth';

export function PatientAppointmentsList() {
  const { showToast, confirm } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sessionId = getPatientPortalSession();
        if (!sessionId) {
          window.location.href = '/patient-portal';
          return;
        }

        const session = await verifyPatientPortalSession(sessionId);
        if (!session) {
          window.location.href = '/patient-portal';
          return;
        }

        setPatientId(session.patientId);
        const patientAppointments = await getAppointmentsByPatient(session.patientId);
        setAppointments(patientAppointments);
        await fetchAvailableSlots();
      } catch (error) {
        console.error('Error loading appointments:', error);
        showToast('Hiba történt az időpontok betöltésekor', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [showToast]);

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const slots = await getAllTimeSlots();
      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const futureSlots = slots.filter(
        (slot: TimeSlot) => 
          new Date(slot.startTime) >= fourHoursFromNow && 
          slot.status === 'available'
      );
      setAvailableSlots(futureSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      showToast('Hiba történt a szabad időpontok betöltésekor', 'error');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !patientId) return;

    setBookingLoading(true);
    try {
      const patient = await getPatient(patientId);
      if (!patient) {
        throw new Error('Páciens nem található');
      }

      const appointment: Appointment = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        timeSlotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        patientName: patient.nev,
        patientTaj: patient.taj,
        dentistEmail: selectedSlot.dentistEmail || selectedSlot.userEmail || '',
        dentistName: selectedSlot.dentistName,
        appointmentStatus: null,
        appointmentType: null,
        approvalStatus: 'pending',
        completionNotes: null,
        isLate: false,
        cim: selectedSlot.cim,
        createdBy: 'patient',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addAppointment(appointment);

      // Update time slot status
      const updatedSlot: TimeSlot = {
        ...selectedSlot,
        status: 'booked',
        updatedAt: new Date().toISOString(),
      };
      await updateTimeSlot(updatedSlot);

      // Send confirmation email if patient has email
      if (patient.email) {
        try {
          const appointmentDate = new Date(selectedSlot.startTime).toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          await fetch('/api/email/appointment-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientEmail: patient.email,
              patientName: patient.nev || 'Tisztelettel',
              appointmentDate,
              dentistName: 'dr. König János',
              address: selectedSlot.cim || '5600 Békéscsaba, Kolozsvári utca 3',
              room: null,
            }),
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the booking if email fails
        }
      }

      showToast('Időpont sikeresen lefoglalva!', 'success');
      setSelectedSlot(null);
      await Promise.all([
        fetchAvailableSlots(),
        (async () => {
          const updatedAppointments = await getAppointmentsByPatient(patientId);
          setAppointments(updatedAppointments);
        })(),
      ]);
    } catch (error) {
      console.error('Error booking appointment:', error);
      showToast(
        error instanceof Error ? error.message : 'Hiba történt az időpont foglalásakor',
        'error'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const getStatusBadge = (appointment: Appointment) => {
    if (appointment.approvalStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
          <AlertCircle className="w-3 h-3" />
          Jóváhagyásra vár
        </span>
      );
    }
    if (appointment.approvalStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
          <XCircle className="w-3 h-3" />
          Elutasítva
        </span>
      );
    }
    if (appointment.approvalStatus === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
          <CheckCircle className="w-3 h-3" />
          Jóváhagyva
        </span>
      );
    }
    if (appointment.appointmentStatus === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          <CheckCircle className="w-3 h-3" />
          Lezárva
        </span>
      );
    }
    if (appointment.appointmentStatus === 'cancelled_by_doctor' || appointment.appointmentStatus === 'cancelled_by_patient') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          <XCircle className="w-3 h-3" />
          Törölve
        </span>
      );
    }
    return null;
  };

  const isPast = (startTime: string) => {
    return new Date(startTime) < new Date();
  };

  const upcomingAppointments = appointments.filter((apt) => !isPast(apt.startTime));
  const pastAppointments = appointments.filter((apt) => isPast(apt.startTime));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
        <span className="ml-3 text-gray-600">Betöltés...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-medical-primary" />
            Időpontok
          </h1>
          <p className="text-gray-600 mt-2">
            Itt találhatja az összes időpontját és foglalhat új időpontot.
          </p>
        </div>
      </div>

      {/* Available Time Slots Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Szabad időpontok
        </h2>
        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-medical-primary"></div>
            <span className="ml-3 text-gray-600">Betöltés...</span>
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="space-y-3">
            {availableSlots.map((slot) => {
              const startTime = new Date(slot.startTime);
              const DEFAULT_CIM = '5600 Békéscsaba, Kolozsvári utca 3';
              const displayCim = slot.cim || DEFAULT_CIM;
              return (
                <div
                  key={slot.id}
                  className="p-4 rounded-lg border-l-4 border-green-500 bg-white hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">
                          {format(startTime, 'yyyy. MMMM d. EEEE, HH:mm', { locale: hu })}
                        </span>
                      </div>
                      {slot.dentistName && (
                        <p className="text-sm text-gray-600 mb-1">
                          Orvos: {slot.dentistName}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {displayCim}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookSlot(slot)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0"
                    >
                      Foglalás
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">
              Jelenleg nincs elérhető szabad időpont.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Következő időpontok
          </h2>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => {
              const startTime = new Date(appointment.startTime);
              return (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {format(startTime, 'yyyy. MMMM d. EEEE, HH:mm', { locale: hu })}
                        </span>
                        {getStatusBadge(appointment)}
                      </div>
                      {appointment.dentistName && (
                        <p className="text-sm text-gray-600 mb-1">
                          Orvos: {appointment.dentistName}
                        </p>
                      )}
                      {appointment.cim && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {appointment.cim}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Korábbi időpontok
          </h2>
          <div className="space-y-3">
            {pastAppointments.map((appointment) => {
              const startTime = new Date(appointment.startTime);
              return (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-700">
                          {format(startTime, 'yyyy. MMMM d. EEEE, HH:mm', { locale: hu })}
                        </span>
                        {getStatusBadge(appointment)}
                      </div>
                      {appointment.dentistName && (
                        <p className="text-sm text-gray-600 mb-1">
                          Orvos: {appointment.dentistName}
                        </p>
                      )}
                      {appointment.cim && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {appointment.cim}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {appointments.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nincsenek időpontok
          </h3>
          <p className="text-gray-600 mb-6">
            Még nincs rögzített időpontja. Foglaljon új időpontot a fenti listából.
          </p>
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          timeSlot={selectedSlot}
          onConfirm={handleConfirmBooking}
          onCancel={() => setSelectedSlot(null)}
          loading={bookingLoading}
        />
      )}
    </div>
  );
}

