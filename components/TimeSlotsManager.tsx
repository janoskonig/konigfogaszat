'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Trash2, Edit2, Clock, X, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTimePicker } from './DateTimePicker';
import { TimeSlot, Appointment } from '@/lib/types';
import { 
  getAllTimeSlots, 
  addTimeSlot, 
  updateTimeSlot, 
  deleteTimeSlot,
  getAllAppointments,
  deleteAppointment,
  getAppointmentByTimeSlot
} from '@/lib/storage';
import { useToast } from '@/contexts/ToastContext';

export function TimeSlotsManager() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [appointments, setAppointments] = useState<Record<string, Appointment>>({});
  const [loadingAppointments, setLoadingAppointments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newStartTime, setNewStartTime] = useState<Date | null>(null);
  const [newCim, setNewCim] = useState<string>('5600 Békéscsaba, Kolozsvári utca 3');
  const DENTIST_NAME = 'dr. König János';
  const DENTIST_EMAIL = 'drkonigjanos@gmail.com';
  const [modifyingAppointment, setModifyingAppointment] = useState<{ appointmentId: string; timeSlotId: string; startTime: string } | null>(null);
  const [newTimeSlotId, setNewTimeSlotId] = useState<string>('');
  const [showPastSlots, setShowPastSlots] = useState(false);
  const [sortField, setSortField] = useState<'startTime' | 'cim' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterCim, setFilterCim] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const { showToast, confirm } = useToast();

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      const allTimeSlots = await getAllTimeSlots();
      
      // Load appointments to map to time slots
      const allAppointments = await getAllAppointments();
      const appointmentsMap: Record<string, Appointment> = {};
      allAppointments.forEach((apt) => {
        appointmentsMap[apt.timeSlotId] = apt;
      });
      
      // Try to load appointments for booked slots that don't have appointments in the map
      const bookedSlotsWithoutAppointments = allTimeSlots.filter(
        slot => slot.status === 'booked' && !appointmentsMap[slot.id]
      );
      
      // Load missing appointments
      for (const slot of bookedSlotsWithoutAppointments) {
        try {
          const apt = await getAppointmentByTimeSlot(slot.id);
          if (apt) {
            appointmentsMap[slot.id] = apt;
          } else {
            // No appointment found, fix the slot status
            const fixedSlot: TimeSlot = {
              ...slot,
              status: 'available',
              updatedAt: new Date().toISOString(),
            };
            try {
              await updateTimeSlot(fixedSlot);
              // Update the slot in the array
              const index = allTimeSlots.findIndex(s => s.id === slot.id);
              if (index !== -1) {
                allTimeSlots[index] = fixedSlot;
              }
            } catch (error) {
              console.error('Error fixing slot status:', error);
            }
          }
        } catch (error) {
          console.error('Error loading appointment for slot:', slot.id, error);
        }
      }
      
      setTimeSlots(allTimeSlots);
      setAppointments(appointmentsMap);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Hiba történt az adatok betöltésekor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimeSlot = async () => {
    if (!newStartTime) {
      showToast('Kérjük, válasszon dátumot és időt!', 'error');
      return;
    }

    try {
      const timeSlot: TimeSlot = {
        id: crypto.randomUUID(),
        startTime: newStartTime.toISOString(),
        status: 'available',
        cim: newCim || '5600 Békéscsaba, Kolozsvári utca 3',
        dentistName: DENTIST_NAME,
        dentistEmail: DENTIST_EMAIL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTimeSlot(timeSlot);
      await loadTimeSlots();
      setNewStartTime(null);
      setNewCim('5600 Békéscsaba, Kolozsvári utca 3');
      setShowForm(false);
      showToast('Időpont sikeresen létrehozva!', 'success');
    } catch (error) {
      console.error('Error creating time slot:', error);
      showToast('Hiba történt az időpont létrehozásakor', 'error');
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    const confirmed = await confirm('Biztosan törölni szeretné ezt az időpontot?');
    if (!confirmed) return;

    try {
      await deleteTimeSlot(id);
      await loadTimeSlots();
      showToast('Időpont sikeresen törölve!', 'success');
    } catch (error) {
      console.error('Error deleting time slot:', error);
      showToast('Hiba történt az időpont törlésekor', 'error');
    }
  };

  const handleGenerateWeeklySlots = async () => {
    const confirmed = await confirm('Ez létrehozza a hétfői és csütörtöki időpontokat (14:00-16:00, 20 percenként) a következő 4 hétre. Folytatja?');
    if (!confirmed) return;

    try {
      const now = new Date();
      const weeksToGenerate = 4;
      const slotsToCreate: TimeSlot[] = [];

      // Generate slots for the next N weeks
      for (let week = 0; week < weeksToGenerate; week++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + (week * 7));
        
        // Find Monday (day 1) of this week
        const monday = new Date(weekStart);
        const dayOfWeek = monday.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is day 1
        monday.setDate(weekStart.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        // Find Thursday (day 4) of this week
        const thursday = new Date(monday);
        thursday.setDate(monday.getDate() + 3);
        thursday.setHours(0, 0, 0, 0);

        // Generate time slots for Monday: 14:00, 14:20, 14:40, 15:00, 15:20, 15:40, 16:00
        for (let hour = 14; hour <= 16; hour++) {
          for (let minute = 0; minute < 60; minute += 20) {
            const slotTime = new Date(monday);
            slotTime.setHours(hour, minute, 0, 0);
            
            // Only create future slots
            if (slotTime > now) {
              slotsToCreate.push({
                id: crypto.randomUUID(),
                startTime: slotTime.toISOString(),
                status: 'available',
                cim: newCim || '5600 Békéscsaba, Kolozsvári utca 3',
                dentistName: DENTIST_NAME,
                dentistEmail: DENTIST_EMAIL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        // Generate time slots for Thursday: 14:00, 14:20, 14:40, 15:00, 15:20, 15:40, 16:00
        for (let hour = 14; hour <= 16; hour++) {
          for (let minute = 0; minute < 60; minute += 20) {
            const slotTime = new Date(thursday);
            slotTime.setHours(hour, minute, 0, 0);
            
            // Only create future slots
            if (slotTime > now) {
              slotsToCreate.push({
                id: crypto.randomUUID(),
                startTime: slotTime.toISOString(),
                status: 'available',
                cim: newCim || '5600 Békéscsaba, Kolozsvári utca 3',
                dentistName: DENTIST_NAME,
                dentistEmail: DENTIST_EMAIL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      // Create all slots
      let createdCount = 0;
      let skippedCount = 0;
      
      for (const slot of slotsToCreate) {
        try {
          // Check if slot already exists (same startTime)
          const existingSlots = timeSlots.filter(ts => {
            const tsDate = new Date(ts.startTime);
            const slotDate = new Date(slot.startTime);
            return tsDate.getTime() === slotDate.getTime();
          });
          
          if (existingSlots.length === 0) {
            await addTimeSlot(slot);
            createdCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error('Error creating slot:', error);
        }
      }

      await loadTimeSlots();
      showToast(
        `${createdCount} időpont létrehozva${skippedCount > 0 ? `, ${skippedCount} már létezett` : ''}!`,
        'success'
      );
    } catch (error) {
      console.error('Error generating weekly slots:', error);
      showToast('Hiba történt az időpontok generálásakor', 'error');
    }
  };

  const handleCancelAppointment = async (appointmentId: string, timeSlotId: string) => {
    const confirmed = await confirm('Biztosan le szeretné mondani ezt az időpontot? Az időpont szabad lesz, de az időpont slot megmarad.');
    if (!confirmed) return;

    try {
      // Delete the appointment
      await deleteAppointment(appointmentId);
      
      // Update time slot status to available
      const slot = timeSlots.find(s => s.id === timeSlotId);
      if (slot) {
        const updatedSlot: TimeSlot = {
          ...slot,
          status: 'available',
          updatedAt: new Date().toISOString(),
        };
        await updateTimeSlot(updatedSlot);
      }
      
      await loadTimeSlots();
      showToast('Időpont sikeresen lemondva!', 'success');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      showToast('Hiba történt az időpont lemondásakor', 'error');
    }
  };

  const handleDeleteBookedSlot = async (slotId: string, appointmentId: string | null) => {
    const confirmed = await confirm('Biztosan törölni szeretné ezt az időpontot? Ez törli az időpont slot-ot és a hozzá tartozó foglalást is.');
    if (!confirmed) return;

    try {
      // Delete appointment if exists
      if (appointmentId) {
        await deleteAppointment(appointmentId);
      }
      
      // Delete the time slot
      await deleteTimeSlot(slotId);
      
      await loadTimeSlots();
      showToast('Időpont sikeresen törölve!', 'success');
    } catch (error) {
      console.error('Error deleting booked slot:', error);
      showToast('Hiba történt az időpont törlésekor', 'error');
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtering and sorting
  const filteredAndSortedSlots = useMemo(() => {
    let filtered = [...timeSlots];
    
    if (filterCim) {
      filtered = filtered.filter(slot => {
        const slotCim = (slot.cim || '5600 Békéscsaba, Kolozsvári utca 3').toLowerCase();
        return slotCim === filterCim.toLowerCase();
      });
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(slot => slot.status === filterStatus);
    }
    
    if (sortField) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'startTime':
            comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            break;
          case 'cim':
            const cimA = (a.cim || '5600 Békéscsaba, Kolozsvári utca 3').toLowerCase();
            const cimB = (b.cim || '5600 Békéscsaba, Kolozsvári utca 3').toLowerCase();
            comparison = cimA.localeCompare(cimB, 'hu');
            break;
          case 'status':
            const statusA = a.status === 'available' ? 0 : 1;
            const statusB = b.status === 'available' ? 0 : 1;
            comparison = statusA - statusB;
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [timeSlots, filterCim, filterStatus, sortField, sortDirection]);

  // Separate future and past slots
  const now = new Date();
  const fourHoursBeforeNow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const allFutureSlots = filteredAndSortedSlots.filter(slot => new Date(slot.startTime) >= fourHoursBeforeNow);
  const allPastSlots = filteredAndSortedSlots.filter(slot => new Date(slot.startTime) < fourHoursBeforeNow);

  // Pagination
  const futureTotalPages = Math.ceil(allFutureSlots.length / itemsPerPage);
  const futureStartIndex = (currentPage - 1) * itemsPerPage;
  const futureEndIndex = futureStartIndex + itemsPerPage;
  const futureSlots = allFutureSlots.slice(futureStartIndex, futureEndIndex);

  const pastTotalPages = Math.ceil(allPastSlots.length / itemsPerPage);
  const pastStartIndex = (currentPage - 1) * itemsPerPage;
  const pastEndIndex = pastStartIndex + itemsPerPage;
  const pastSlots = allPastSlots.slice(pastStartIndex, pastEndIndex);

  const uniqueCims = useMemo(() => {
    const cims = new Set<string>();
    timeSlots.forEach(slot => {
      const cim = slot.cim || '5600 Békéscsaba, Kolozsvári utca 3';
      cims.add(cim);
    });
    return Array.from(cims).sort();
  }, [timeSlots]);

  const handleSort = (field: 'startTime' | 'cim' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortableHeader = (label: string, field: 'startTime' | 'cim' | 'status', className?: string) => {
    const isActive = sortField === field;
    const SortIcon = isActive 
      ? (sortDirection === 'asc' ? ArrowUp : ArrowDown)
      : null;
    
    return (
      <th 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none ${
          isActive ? 'bg-gray-100' : ''
        } ${className || ''}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {SortIcon && (
            <SortIcon className="w-3 h-3 text-blue-600" />
          )}
        </div>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">Betöltés...</p>
      </div>
    );
  }

  const renderTimeSlotTable = (slots: TimeSlot[], isPast: boolean = false) => {
    if (slots.length === 0) {
      return null;
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={isPast ? "bg-gray-100" : "bg-gray-50"}>
            <tr>
              {renderSortableHeader('Időpont', 'startTime')}
              {renderSortableHeader('Cím', 'cim')}
              {renderSortableHeader('Státusz', 'status')}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Lefoglalva
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Műveletek
              </th>
            </tr>
          </thead>
          <tbody className={isPast ? "bg-gray-50 divide-y divide-gray-200" : "bg-white divide-y divide-gray-200"}>
            {slots.map((slot) => {
              const appointment = appointments[slot.id];
              return (
                <tr 
                  key={slot.id} 
                  className={`${isPast ? 'opacity-60' : ''} ${
                    slot.status === 'booked' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className={`w-4 h-4 mr-2 ${isPast ? 'text-gray-400' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                        {formatDateTime(slot.startTime)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                      {slot.cim || '5600 Békéscsaba, Kolozsvári utca 3'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        slot.status === 'available'
                          ? isPast 
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-green-100 text-green-800'
                          : isPast
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {slot.status === 'available' ? 'Szabad' : 'Lefoglalva'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {appointment ? (
                      <div className={`text-sm space-y-1 ${isPast ? 'text-gray-500' : ''}`}>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Beteg:</span>
                          <div className={`font-medium mt-0.5 ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                            {appointment.patientName || 'Név nélküli beteg'}
                          </div>
                          {appointment.patientTaj && (
                            <div className="text-xs text-gray-500">
                              TAJ: {appointment.patientTaj}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : slot.status === 'booked' ? (
                      <div className="text-sm text-gray-500">
                        {loadingAppointments[slot.id] ? (
                          <span>Betöltés...</span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              setLoadingAppointments(prev => ({ ...prev, [slot.id]: true }));
                              try {
                                const apt = await getAppointmentByTimeSlot(slot.id);
                                if (apt) {
                                  setAppointments(prev => ({ ...prev, [slot.id]: apt }));
                                } else {
                                  // No appointment found, fix the slot status
                                  const fixedSlot: TimeSlot = {
                                    ...slot,
                                    status: 'available',
                                    updatedAt: new Date().toISOString(),
                                  };
                                  await updateTimeSlot(fixedSlot);
                                  await loadTimeSlots();
                                }
                              } catch (error) {
                                console.error('Error loading appointment:', error);
                              } finally {
                                setLoadingAppointments(prev => ({ ...prev, [slot.id]: false }));
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 underline text-xs"
                          >
                            Beteg adatainak betöltése
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className={`text-sm ${isPast ? 'text-gray-400' : 'text-gray-400'}`}>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {slot.status === 'available' && (
                        <button
                          onClick={() => handleDeleteTimeSlot(slot.id)}
                          className={`${isPast ? 'text-gray-500 hover:text-gray-700' : 'text-red-600 hover:text-red-900'}`}
                          title="Törlés"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {slot.status === 'booked' && (
                        <>
                          {appointment && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.id, slot.id)}
                              className={`${isPast ? 'text-gray-500 hover:text-gray-700' : 'text-orange-600 hover:text-orange-900'} flex items-center gap-1`}
                              title="Időpont lemondása (szabad lesz)"
                            >
                              <X className="w-4 h-4" />
                              <span className="text-xs">Lemondás</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBookedSlot(slot.id, appointment?.id || null)}
                            className={`${isPast ? 'text-gray-500 hover:text-gray-700' : 'text-red-600 hover:text-red-900'}`}
                            title="Időpont törlése"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Szabad időpontok kezelése</h3>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateWeeklySlots}
            className="btn-secondary flex items-center gap-2"
            title="Hétfő és csütörtök 14:00-16:00, 20 percenként"
          >
            <Calendar className="w-4 h-4" />
            Heti időpontok generálása
          </button>
          <button
            onClick={() => {
              setNewStartTime(null);
              setNewCim('5600 Békéscsaba, Kolozsvári utca 3');
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Új időpont
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cím
          </label>
          <select
            value={filterCim}
            onChange={(e) => {
              setFilterCim(e.target.value);
              setCurrentPage(1);
            }}
            className="form-input w-full"
          >
            <option value="">Összes cím</option>
            {uniqueCims.map(cim => (
              <option key={cim} value={cim}>{cim}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Státusz
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as 'all' | 'available' | 'booked');
              setCurrentPage(1);
            }}
            className="form-input w-full"
          >
            <option value="all">Összes</option>
            <option value="available">Szabad</option>
            <option value="booked">Lefoglalva</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card p-4">
          <h4 className="font-medium mb-4">Új időpont létrehozása</h4>
          <div className="space-y-4">
            <DateTimePicker
              selected={newStartTime}
              onChange={(date: Date | null) => setNewStartTime(date)}
              minDate={new Date()}
              placeholder="Válasszon dátumot és időt"
              className="form-input"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cím
              </label>
              <input
                type="text"
                value={newCim}
                onChange={(e) => setNewCim(e.target.value)}
                placeholder="5600 Békéscsaba, Kolozsvári utca 3"
                className="form-input w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateTimeSlot}
                className="btn-primary"
              >
                Mentés
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewStartTime(null);
                  setNewCim('5600 Békéscsaba, Kolozsvári utca 3');
                }}
                className="btn-secondary"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future slots */}
      {(allFutureSlots.length > 0 || allPastSlots.length === 0) && (
        <div className="card">
          <h4 className="text-lg font-semibold mb-4">Jövőbeli időpontok</h4>
          {futureSlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nincs jövőbeli időpont.</p>
            </div>
          ) : (
            renderTimeSlotTable(futureSlots, false)
          )}
        </div>
      )}

      {/* Past slots */}
      {allPastSlots.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowPastSlots(!showPastSlots)}
            className="flex items-center justify-between w-full mb-4 text-left"
          >
            <h4 className="text-lg font-semibold text-gray-600">
              Elmúlt időpontok ({allPastSlots.length})
            </h4>
            {showPastSlots ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          {showPastSlots && (
            <>
              {pastSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nincs elmúlt időpont ezen az oldalon.</p>
                </div>
              ) : (
                renderTimeSlotTable(pastSlots, true)
              )}
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {futureTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Oldal {currentPage} / {futureTotalPages} (összesen {allFutureSlots.length} jövőbeli időpont)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, futureTotalPages) }, (_, i) => {
                let pageNum: number;
                if (futureTotalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= futureTotalPages - 2) {
                  pageNum = futureTotalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentPage === pageNum
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
              onClick={() => setCurrentPage(prev => Math.min(futureTotalPages, prev + 1))}
              disabled={currentPage === futureTotalPages}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === futureTotalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {timeSlots.length === 0 && (
        <div className="card">
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Még nincs létrehozva időpont.</p>
          </div>
        </div>
      )}
    </div>
  );
}

