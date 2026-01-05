import CryptoJS from 'crypto-js';
import { getSetting, setSetting } from './storage';
import { PatientPortalToken, PatientPortalSession } from './types';
import { 
  addPatientPortalToken, 
  getPatientPortalTokenByToken, 
  updatePatientPortalToken,
  addPatientPortalSession,
  getPatientPortalSessionBySessionId,
  deletePatientPortalSession
} from './storage';

const DENTIST_PASSWORD_KEY = 'dentist_password_hash';
const DEFAULT_PASSWORD = 'admin'; // Default password, should be changed on first login

// Dentist authentication
export async function hashPassword(password: string): Promise<string> {
  return CryptoJS.SHA256(password).toString();
}

export async function verifyDentistPassword(password: string): Promise<boolean> {
  const storedHash = await getSetting(DENTIST_PASSWORD_KEY);
  if (!storedHash) {
    // First time setup - set default password
    const defaultHash = await hashPassword(DEFAULT_PASSWORD);
    await setSetting(DENTIST_PASSWORD_KEY, defaultHash);
    return password === DEFAULT_PASSWORD;
  }
  
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

export async function setDentistPassword(password: string): Promise<void> {
  const hash = await hashPassword(password);
  await setSetting(DENTIST_PASSWORD_KEY, hash);
}

// Patient Portal Token Management
export function generateToken(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

export function generateSessionId(): string {
  return CryptoJS.lib.WordArray.random(32).toString();
}

export async function createPatientPortalToken(
  email: string,
  taj: string,
  patientId: string | null = null
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

  const tokenData: PatientPortalToken = {
    id: crypto.randomUUID(),
    token,
    patientId,
    email,
    taj,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: new Date().toISOString(),
  };

  await addPatientPortalToken(tokenData);
  return token;
}

export async function verifyPatientPortalToken(token: string): Promise<PatientPortalToken | null> {
  const tokenData = await getPatientPortalTokenByToken(token);
  
  if (!tokenData) {
    return null;
  }

  if (tokenData.used) {
    return null; // Token already used
  }

  const expiresAt = new Date(tokenData.expiresAt);
  if (expiresAt < new Date()) {
    return null; // Token expired
  }

  // Mark token as used
  tokenData.used = true;
  await updatePatientPortalToken(tokenData);

  return tokenData;
}

// Patient Portal Session Management
export async function createPatientPortalSession(
  patientId: string,
  email: string
): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Session valid for 30 days

  const session: PatientPortalSession = {
    id: crypto.randomUUID(),
    sessionId,
    patientId,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await addPatientPortalSession(session);
  return sessionId;
}

export async function verifyPatientPortalSession(sessionId: string): Promise<PatientPortalSession | null> {
  const session = await getPatientPortalSessionBySessionId(sessionId);
  
  if (!session) {
    return null;
  }

  const expiresAt = new Date(session.expiresAt);
  if (expiresAt < new Date()) {
    // Session expired, delete it
    await deletePatientPortalSession(sessionId);
    return null;
  }

  return session;
}

export async function logoutPatientPortalSession(sessionId: string): Promise<void> {
  await deletePatientPortalSession(sessionId);
}

// Browser storage helpers for client-side
export function setDentistSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('dentist_authenticated', 'true');
  }
}

export function clearDentistSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('dentist_authenticated');
  }
}

export function isDentistAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('dentist_authenticated') === 'true';
  }
  return false;
}

export function setPatientPortalSession(sessionId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('patient_portal_session', sessionId);
  }
}

export function getPatientPortalSession(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('patient_portal_session');
  }
  return null;
}

export function clearPatientPortalSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('patient_portal_session');
  }
}

