import { 
  TimeSlot, 
  Appointment, 
  Patient, 
  PatientPortalToken, 
  PatientPortalSession,
} from './types';

// Helper function for API calls
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Time Slots
export async function addTimeSlot(timeSlot: TimeSlot): Promise<TimeSlot> {
  return apiCall<TimeSlot>('/api/time-slots', {
    method: 'POST',
    body: JSON.stringify(timeSlot),
  });
}

export async function getTimeSlot(id: string): Promise<TimeSlot | null> {
  try {
    return await apiCall<TimeSlot>(`/api/time-slots/${id}`);
  } catch (error) {
    return null;
  }
}

export async function getAllTimeSlots(): Promise<TimeSlot[]> {
  return apiCall<TimeSlot[]>('/api/time-slots');
}

export async function updateTimeSlot(timeSlot: TimeSlot): Promise<TimeSlot> {
  return apiCall<TimeSlot>(`/api/time-slots/${timeSlot.id}`, {
    method: 'PUT',
    body: JSON.stringify(timeSlot),
  });
}

export async function deleteTimeSlot(id: string): Promise<void> {
  await apiCall(`/api/time-slots/${id}`, {
    method: 'DELETE',
  });
}

export async function getTimeSlotsByDateRange(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  return apiCall<TimeSlot[]>(`/api/time-slots/range?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`);
}

// Appointments
export async function addAppointment(appointment: Appointment): Promise<Appointment> {
  return apiCall<Appointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  });
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  try {
    return await apiCall<Appointment>(`/api/appointments/${id}`);
  } catch (error) {
    return null;
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  return apiCall<Appointment[]>('/api/appointments');
}

export async function updateAppointment(appointment: Appointment): Promise<Appointment> {
  return apiCall<Appointment>(`/api/appointments/${appointment.id}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiCall(`/api/appointments/${id}`, {
    method: 'DELETE',
  });
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();
  return apiCall<Appointment[]>(`/api/appointments/range?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`);
}

export async function getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
  return apiCall<Appointment[]>(`/api/appointments/patient/${patientId}`);
}

export async function getAppointmentByTimeSlot(timeSlotId: string): Promise<Appointment | null> {
  try {
    return await apiCall<Appointment>(`/api/appointments/time-slot/${timeSlotId}`);
  } catch (error) {
    return null;
  }
}

// Patients
export async function addPatient(patient: Patient): Promise<Patient> {
  return apiCall<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
}

export async function getPatient(id: string): Promise<Patient | null> {
  try {
    return await apiCall<Patient>(`/api/patients/${id}`);
  } catch (error) {
    return null;
  }
}

export async function getAllPatients(): Promise<Patient[]> {
  return apiCall<Patient[]>('/api/patients');
}

export async function updatePatient(patient: Patient): Promise<Patient> {
  return apiCall<Patient>(`/api/patients/${patient.id}`, {
    method: 'PUT',
    body: JSON.stringify(patient),
  });
}

export async function deletePatient(id: string): Promise<void> {
  await apiCall(`/api/patients/${id}`, {
    method: 'DELETE',
  });
}

export async function getPatientByEmail(email: string): Promise<Patient | null> {
  try {
    return await apiCall<Patient>(`/api/patients/email/${encodeURIComponent(email)}`);
  } catch (error) {
    return null;
  }
}

export async function getPatientByEmailAndTaj(email: string, taj: string): Promise<Patient | null> {
  try {
    return await apiCall<Patient>('/api/patients/email-taj', {
      method: 'POST',
      body: JSON.stringify({ email, taj }),
    });
  } catch (error) {
    return null;
  }
}

export async function searchPatients(query: string): Promise<Patient[]> {
  return apiCall<Patient[]>(`/api/patients/search?q=${encodeURIComponent(query)}`);
}

// Patient Portal Tokens
export async function addPatientPortalToken(token: PatientPortalToken): Promise<PatientPortalToken> {
  return apiCall<PatientPortalToken>('/api/patient-portal/tokens', {
    method: 'POST',
    body: JSON.stringify(token),
  });
}

export async function getPatientPortalTokenByToken(token: string): Promise<PatientPortalToken | null> {
  try {
    return await apiCall<PatientPortalToken>(`/api/patient-portal/tokens/${encodeURIComponent(token)}`);
  } catch (error) {
    return null;
  }
}

export async function updatePatientPortalToken(token: PatientPortalToken): Promise<PatientPortalToken> {
  return apiCall<PatientPortalToken>(`/api/patient-portal/tokens/${encodeURIComponent(token.token)}`, {
    method: 'PUT',
    body: JSON.stringify(token),
  });
}

// Patient Portal Sessions
export async function addPatientPortalSession(session: PatientPortalSession): Promise<PatientPortalSession> {
  return apiCall<PatientPortalSession>('/api/patient-portal/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });
}

export async function getPatientPortalSessionBySessionId(sessionId: string): Promise<PatientPortalSession | null> {
  try {
    return await apiCall<PatientPortalSession>(`/api/patient-portal/sessions/${encodeURIComponent(sessionId)}`);
  } catch (error) {
    return null;
  }
}

export async function deletePatientPortalSession(sessionId: string): Promise<void> {
  await apiCall(`/api/patient-portal/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

// Settings
export async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await apiCall<{ value: string | null }>(`/api/settings/${encodeURIComponent(key)}`);
    return result.value;
  } catch (error) {
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await apiCall(`/api/settings/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

// Legacy function for backward compatibility
export async function initDB(): Promise<any> {
  // This function is no longer needed with PostgreSQL, but kept for compatibility
  return Promise.resolve(null);
}
