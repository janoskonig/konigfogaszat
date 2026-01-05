export type AppointmentStatus = 
  | 'cancelled_by_doctor' 
  | 'cancelled_by_patient' 
  | 'completed' 
  | 'no_show' 
  | null;

export type AppointmentType = 
  | 'elso_konzultacio' 
  | 'munkafazis' 
  | 'kontroll' 
  | null;

export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | null;

export interface TimeSlot {
  id: string;
  startTime: string;
  status: 'available' | 'booked';
  cim?: string | null;
  teremszam?: string | null;
  dentistName?: string | null;
  dentistEmail?: string | null;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  timeSlotId: string;
  startTime: string;
  patientName: string | null;
  patientTaj: string | null;
  dentistEmail: string;
  dentistName?: string | null;
  appointmentStatus?: AppointmentStatus;
  appointmentType?: AppointmentType;
  approvalStatus?: ApprovalStatus;
  completionNotes?: string | null;
  isLate?: boolean;
  cim?: string | null;
  teremszam?: string | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  nev: string | null;
  taj: string | null;
  email: string | null;
  telefonszam: string | null;
  szuletesiDatum: string | null;
  nem: 'ferfi' | 'no' | 'nem_ismert' | null;
  cim: string | null;
  varos: string | null;
  iranyitoszam: string | null;
  beutaloOrvos?: string | null;
  beutaloIndokolas?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPortalToken {
  id: string;
  token: string;
  patientId: string | null;
  email: string;
  taj: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface PatientPortalSession {
  id: string;
  sessionId: string;
  patientId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

