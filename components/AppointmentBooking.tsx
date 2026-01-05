'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, Download, User, Trash2, Edit2, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Clock as ClockIcon } from 'lucide-react';
import { Patient, Appointment, TimeSlot, AppointmentStatus } from '@/lib/types';
import { 
  getAllPatients, 
  getAllTimeSlots, 
  getAllAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
  updateTimeSlot,
  addPatient
} from '@/lib/storage';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export function AppointmentBooking() {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [newTimeSlotId, setNewTimeSlotId] = useState<string>('');
  const [editingStatus, setEditingStatus] = useState<Appointment | null>(null);
  const [statusForm, setStatusForm] = useState<{
    appointmentStatus: AppointmentStatus;
    completionNotes: string;
    isLate: boolean;
  }>({
    appointmentStatus: null,
    completionNotes: '',
    isLate: false,
  });
  const [appointmentsPage, setAppointmentsPage] = useState<number>(1);
  const [showNewPatientForm, setShowNewPatientForm] = useState<boolean>(false);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    nev: '',
    taj: '',
    email: '',
    telefonszam: '',
    szuletesiDatum: '',
    nem: null,
    cim: '',
    varos: '',
    iranyitoszam: '',
  });
  const itemsPerPage = 50;
  const { showToast, confirm } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [slots, apts, pats] = await Promise.all([
        getAllTimeSlots(),
        getAllAppointments(),
        getAllPatients(),
      ]);

      // Filter future slots (4 hours from now)
      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const futureSlots = slots.filter((slot: TimeSlot) => 
        new Date(slot.startTime) >= fourHoursFromNow && slot.status === 'available'
      );
      setAvailableSlots(futureSlots);
      setAppointments(apts);
      setPatients(pats);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Hiba történt az adatok betöltésekor', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // All hooks must be called before any conditional returns
  const availableSlotsOnly = useMemo(
    () => availableSlots.filter(slot => slot.status === 'available'),
    [availableSlots]
  );

  const availableSlotsForModification = useMemo(
    () => availableSlotsOnly.filter(
      slot => !editingAppointment || slot.id !== editingAppointment.timeSlotId
    ),
    [availableSlotsOnly, editingAppointment]
  );

  const paginatedAppointments = useMemo(() => {
    const start = (appointmentsPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return appointments.slice(start, end);
  }, [appointments, appointmentsPage]);

  const totalPages = Math.ceil(appointments.length / itemsPerPage);

  const handleBookAppointment = useCallback(async () => {
    if (!selectedPatient || !selectedSlot) {
      showToast('Kérjük, válasszon beteget és időpontot!', 'error');
      return;
    }

    const confirmed = await confirm('Biztosan le szeretné foglalni ezt az időpontot?');
    if (!confirmed) return;

    try {
      const patient = patients.find(p => p.id === selectedPatient);
      const slot = availableSlots.find(s => s.id === selectedSlot);
      
      if (!patient || !slot) {
        showToast('Hiba: beteg vagy időpont nem található', 'error');
        return;
      }

      const appointment: Appointment = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        timeSlotId: slot.id,
        startTime: slot.startTime,
        patientName: patient.nev,
        patientTaj: patient.taj,
        dentistEmail: slot.dentistEmail || slot.userEmail || '',
        dentistName: slot.dentistName,
        appointmentStatus: null,
        appointmentType: null,
        approvalStatus: 'approved',
        completionNotes: null,
        isLate: false,
        cim: slot.cim,
        createdBy: 'dentist',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addAppointment(appointment);
      
      // Update time slot status
      const updatedSlot: TimeSlot = {
        ...slot,
        status: 'booked',
        updatedAt: new Date().toISOString(),
      };
      await updateTimeSlot(updatedSlot);

      // Send confirmation email if patient has email
      if (patient.email) {
        try {
          const appointmentDate = new Date(slot.startTime).toLocaleString('hu-HU', {
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
              address: slot.cim || '5600 Békéscsaba, Kolozsvári utca 3',
              room: null,
            }),
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the booking if email fails
        }
      }

      await loadData();
      setSelectedPatient('');
      setSelectedSlot('');
      showToast('Időpont sikeresen lefoglalva!', 'success');
    } catch (error) {
      console.error('Error booking appointment:', error);
      showToast('Hiba történt az időpont foglalásakor', 'error');
    }
  }, [selectedPatient, selectedSlot, patients, availableSlots, loadData, confirm, showToast]);

  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    const confirmed = await confirm('Biztosan le szeretné mondani ezt az időpontot?');
    if (!confirmed) return;

    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      await deleteAppointment(appointmentId);

      // Update time slot back to available - get it from all time slots
      const allSlots = await getAllTimeSlots();
      const slot = allSlots.find(s => s.id === appointment.timeSlotId);
      if (slot) {
        const updatedSlot: TimeSlot = {
          ...slot,
          status: 'available',
          updatedAt: new Date().toISOString(),
        };
        await updateTimeSlot(updatedSlot);
      }

      // Send cancellation email if patient has email
      const patient = patients.find(p => p.id === appointment.patientId);
      if (patient?.email) {
        try {
          const appointmentDate = new Date(appointment.startTime).toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          await fetch('/api/email/appointment-cancellation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientEmail: patient.email,
              patientName: appointment.patientName || patient.nev || 'Tisztelettel',
              appointmentDate,
              cancelledBy: 'doctor',
            }),
          });
        } catch (emailError) {
          console.error('Error sending cancellation email:', emailError);
          // Don't fail the cancellation if email fails
        }
      }

      await loadData();
      showToast('Időpont sikeresen lemondva!', 'success');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showToast('Hiba történt az időpont lemondásakor', 'error');
    }
  }, [appointments, availableSlots, loadData, confirm, showToast]);

  const handleModifyAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setNewTimeSlotId('');
  }, []);

  const handleSaveModification = useCallback(async () => {
    if (!editingAppointment || !newTimeSlotId) {
      showToast('Kérjük, válasszon új időpontot!', 'error');
      return;
    }

    const confirmed = await confirm('Biztosan módosítani szeretné ezt az időpontot?');
    if (!confirmed) return;

    try {
      const newSlot = availableSlots.find(s => s.id === newTimeSlotId);
      if (!newSlot) {
        showToast('Hiba: új időpont nem található', 'error');
        return;
      }

      // Free old slot - get it from all time slots
      const allSlots = await getAllTimeSlots();
      const oldSlot = allSlots.find(s => s.id === editingAppointment.timeSlotId);
      if (oldSlot) {
        const updatedOldSlot: TimeSlot = {
          ...oldSlot,
          status: 'available',
          updatedAt: new Date().toISOString(),
        };
        await updateTimeSlot(updatedOldSlot);
      }

      // Book new slot
      const updatedNewSlot: TimeSlot = {
        ...newSlot,
        status: 'booked',
        updatedAt: new Date().toISOString(),
      };
      await updateTimeSlot(updatedNewSlot);

      // Update appointment
      const updatedAppointment: Appointment = {
        ...editingAppointment,
        timeSlotId: newTimeSlotId,
        startTime: newSlot.startTime,
        cim: newSlot.cim,
        updatedAt: new Date().toISOString(),
      };
      await updateAppointment(updatedAppointment);

      // Send modification email if patient has email
      const patient = patients.find(p => p.id === editingAppointment.patientId);
      if (patient?.email) {
        try {
          const oldDate = new Date(editingAppointment.startTime).toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const newDate = new Date(newSlot.startTime).toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          await fetch('/api/email/appointment-modification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientEmail: patient.email,
              patientName: editingAppointment.patientName || patient.nev || 'Tisztelettel',
              oldDate,
              newDate,
              dentistName: 'dr. König János',
              address: newSlot.cim || '5600 Békéscsaba, Kolozsvári utca 3',
              room: newSlot.teremszam,
            }),
          });
        } catch (emailError) {
          console.error('Error sending modification email:', emailError);
          // Don't fail the modification if email fails
        }
      }

      await loadData();
      setEditingAppointment(null);
      setNewTimeSlotId('');
      showToast('Időpont sikeresen módosítva!', 'success');
    } catch (error) {
      console.error('Error modifying appointment:', error);
      showToast('Hiba történt az időpont módosításakor', 'error');
    }
  }, [editingAppointment, newTimeSlotId, availableSlots, patients, loadData, confirm, showToast]);

  const handleEditStatus = useCallback((appointment: Appointment) => {
    setEditingStatus(appointment);
    setStatusForm({
      appointmentStatus: appointment.appointmentStatus || null,
      completionNotes: appointment.completionNotes || '',
      isLate: appointment.isLate || false,
    });
  }, []);

  const handleSaveStatus = useCallback(async () => {
    if (!editingStatus) return;

    if (statusForm.appointmentStatus === 'completed' && !statusForm.completionNotes.trim()) {
      showToast('A "mi történt?" mező kitöltése kötelező sikeresen teljesült időpont esetén.', 'error');
      return;
    }

    try {
      const updatedAppointment: Appointment = {
        ...editingStatus,
        appointmentStatus: statusForm.appointmentStatus,
        completionNotes: statusForm.appointmentStatus === 'completed' ? statusForm.completionNotes : null,
        isLate: statusForm.isLate,
        updatedAt: new Date().toISOString(),
      };
      await updateAppointment(updatedAppointment);
      await loadData();
      setEditingStatus(null);
      setStatusForm({
        appointmentStatus: null,
        completionNotes: '',
        isLate: false,
      });
      showToast('Időpont státusza sikeresen frissítve!', 'success');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showToast('Hiba történt az időpont státuszának frissítésekor', 'error');
    }
  }, [editingStatus, statusForm, loadData, showToast]);

  const getStatusLabel = useCallback((status: AppointmentStatus | null | undefined, isLate?: boolean) => {
    if (isLate) {
      return { label: 'Késett', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: ClockIcon };
    }
    switch (status) {
      case 'cancelled_by_doctor':
        return { label: 'Lemondta az orvos', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
      case 'cancelled_by_patient':
        return { label: 'Lemondta a beteg', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
      case 'completed':
        return { label: 'Sikeresen teljesült', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle2 };
      case 'no_show':
        return { label: 'Nem jelent meg', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
      default:
        return null;
    }
  }, []);

  const formatDateTime = useCallback((dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Edit Modal */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Időpont státusz szerkesztése</h3>
              <button
                onClick={() => {
                  setEditingStatus(null);
                  setStatusForm({
                    appointmentStatus: null,
                    completionNotes: '',
                    isLate: false,
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Beteg:</strong> {editingStatus.patientName || 'Név nélküli'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Időpont:</strong> {formatDateTime(editingStatus.startTime)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Státusz
                </label>
                <select
                  value={statusForm.appointmentStatus || ''}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setStatusForm({
                      ...statusForm,
                      appointmentStatus: value as AppointmentStatus,
                      completionNotes: value === 'completed' ? statusForm.completionNotes : '',
                    });
                  }}
                  className="form-input w-full"
                >
                  <option value="">Nincs státusz (normál időpont)</option>
                  <option value="cancelled_by_doctor">Lemondta az orvos</option>
                  <option value="cancelled_by_patient">Lemondta a beteg</option>
                  <option value="completed">Sikeresen teljesült</option>
                  <option value="no_show">Nem jelent meg</option>
                </select>
              </div>
              {statusForm.appointmentStatus === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mi történt? <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={statusForm.completionNotes}
                    onChange={(e) => setStatusForm({ ...statusForm, completionNotes: e.target.value })}
                    className="form-input w-full"
                    rows={3}
                    placeholder="Rövid leírás arról, hogy mi történt az időpont során..."
                  />
                </div>
              )}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={statusForm.isLate}
                    onChange={(e) => setStatusForm({ ...statusForm, isLate: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="text-sm font-medium text-gray-700">Késett a beteg</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingStatus(null);
                    setStatusForm({
                      appointmentStatus: null,
                      completionNotes: '',
                      isLate: false,
                    });
                  }}
                  className="btn-secondary"
                >
                  Mégse
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="btn-primary"
                >
                  Mentés
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modification Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Időpont módosítása</h3>
              <button
                onClick={() => {
                  setEditingAppointment(null);
                  setNewTimeSlotId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Beteg:</strong> {editingAppointment.patientName || 'Név nélküli'}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Jelenlegi időpont:</strong> {formatDateTime(editingAppointment.startTime)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Új időpont
                </label>
                <select
                  value={newTimeSlotId}
                  onChange={(e) => setNewTimeSlotId(e.target.value)}
                  className="form-input w-full"
                >
                  <option value="">Válasszon új időpontot...</option>
                  {availableSlotsForModification.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {formatDateTime(slot.startTime)}
                      {` - ${slot.cim || '5600 Békéscsaba, Kolozsvári utca 3'}`}
                    </option>
                  ))}
                </select>
                {availableSlotsForModification.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Jelenleg nincs elérhető szabad időpont.
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingAppointment(null);
                    setNewTimeSlotId('');
                  }}
                  className="btn-secondary"
                >
                  Mégse
                </button>
                <button
                  onClick={handleSaveModification}
                  disabled={!newTimeSlotId}
                  className="btn-primary"
                >
                  Módosítás mentése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book New Appointment */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Új időpont foglalása</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Beteg
              </label>
              <button
                type="button"
                onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showNewPatientForm ? 'Mégse' : '+ Új beteg'}
              </button>
            </div>
            {!showNewPatientForm ? (
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="form-input w-full"
              >
                <option value="">Válasszon beteget...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.nev || 'Név nélküli'} {patient.taj ? `(${patient.taj})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Név *
                    </label>
                    <input
                      type="text"
                      value={newPatient.nev || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, nev: e.target.value })}
                      className="form-input w-full"
                      placeholder="Beteg neve"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TAJ szám
                    </label>
                    <input
                      type="text"
                      value={newPatient.taj || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, taj: e.target.value })}
                      className="form-input w-full"
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newPatient.email || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                      className="form-input w-full"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefonszám
                    </label>
                    <input
                      type="tel"
                      value={newPatient.telefonszam || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, telefonszam: e.target.value })}
                      className="form-input w-full"
                      placeholder="+36 20 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Születési dátum
                    </label>
                    <input
                      type="date"
                      value={newPatient.szuletesiDatum || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, szuletesiDatum: e.target.value })}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nem
                    </label>
                    <select
                      value={newPatient.nem || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, nem: e.target.value as 'ferfi' | 'no' | 'nem_ismert' | null })}
                      className="form-input w-full"
                    >
                      <option value="">Válasszon...</option>
                      <option value="ferfi">Férfi</option>
                      <option value="no">Nő</option>
                      <option value="nem_ismert">Nem ismert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cím
                    </label>
                    <input
                      type="text"
                      value={newPatient.cim || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, cim: e.target.value })}
                      className="form-input w-full"
                      placeholder="Utca, házszám"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Város
                    </label>
                    <input
                      type="text"
                      value={newPatient.varos || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, varos: e.target.value })}
                      className="form-input w-full"
                      placeholder="Város"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Irányítószám
                    </label>
                    <input
                      type="text"
                      value={newPatient.iranyitoszam || ''}
                      onChange={(e) => setNewPatient({ ...newPatient, iranyitoszam: e.target.value })}
                      className="form-input w-full"
                      placeholder="1234"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newPatient.nev) {
                        showToast('A név megadása kötelező!', 'error');
                        return;
                      }
                      try {
                        const createdPatient = await addPatient({
                          id: crypto.randomUUID(),
                          ...newPatient,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        } as Patient);
                        await loadData();
                        setSelectedPatient(createdPatient.id);
                        setShowNewPatientForm(false);
                        setNewPatient({
                          nev: '',
                          taj: '',
                          email: '',
                          telefonszam: '',
                          szuletesiDatum: '',
                          nem: null,
                          cim: '',
                          varos: '',
                          iranyitoszam: '',
                        });
                        showToast('Beteg sikeresen hozzáadva!', 'success');
                      } catch (error) {
                        console.error('Error creating patient:', error);
                        showToast('Hiba történt a beteg hozzáadásakor', 'error');
                      }
                    }}
                    className="btn-primary"
                  >
                    Beteg hozzáadása
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPatientForm(false);
                      setNewPatient({
                        nev: '',
                        taj: '',
                        email: '',
                        telefonszam: '',
                        szuletesiDatum: '',
                        nem: null,
                        cim: '',
                        varos: '',
                        iranyitoszam: '',
                      });
                    }}
                    className="btn-secondary"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Szabad időpont
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="form-input w-full"
            >
              <option value="">Válasszon időpontot...</option>
              {availableSlotsOnly.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDateTime(slot.startTime)}
                  {slot.dentistName ? ` - ${slot.dentistName}` : ''}
                  {slot.cim ? ` - ${slot.cim}` : ''}
                  {slot.teremszam ? ` (Terem: ${slot.teremszam})` : ''}
                </option>
              ))}
            </select>
            {availableSlotsOnly.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Jelenleg nincs elérhető szabad időpont.
              </p>
            )}
          </div>
          <button
            onClick={handleBookAppointment}
            disabled={!selectedPatient || !selectedSlot}
            className="btn-primary w-full"
          >
            Időpont foglalása
          </button>
        </div>
      </div>

      {/* My Appointments */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Lefoglalt időpontjaim</h3>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Még nincs lefoglalt időpont.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Beteg
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Időpont
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Orvos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Státusz
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patientName || 'Név nélküli'}
                          </div>
                          {appointment.patientTaj && (
                            <div className="text-sm text-gray-500">
                              TAJ: {appointment.patientTaj}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDateTime(appointment.startTime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {appointment.dentistEmail}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const statusInfo = getStatusLabel(appointment.appointmentStatus, appointment.isLate);
                        if (statusInfo) {
                          const StatusIcon = statusInfo.icon;
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
                              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                              <span className={`text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          );
                        }
                        return <span className="text-xs text-gray-400">-</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEditStatus(appointment)}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                          title="Státusz szerkesztése"
                        >
                          <Edit2 className="w-4 h-4" />
                          Státusz
                        </button>
                        <button
                          onClick={() => handleModifyAppointment(appointment)}
                          className="text-amber-600 hover:text-amber-900 flex items-center gap-1"
                          title="Időpont módosítása"
                        >
                          <Edit2 className="w-4 h-4" />
                          Módosítás
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Időpont lemondása"
                        >
                          <Trash2 className="w-4 h-4" />
                          Lemondás
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Oldal {appointmentsPage} / {totalPages} (összesen {appointments.length} időpont)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAppointmentsPage(prev => Math.max(1, prev - 1))}
                disabled={appointmentsPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  appointmentsPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (appointmentsPage <= 3) {
                    pageNum = i + 1;
                  } else if (appointmentsPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = appointmentsPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setAppointmentsPage(pageNum)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        appointmentsPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setAppointmentsPage(prev => Math.min(totalPages, prev + 1))}
                disabled={appointmentsPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  appointmentsPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

