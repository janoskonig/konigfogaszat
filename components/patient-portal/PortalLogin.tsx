'use client';

import { useState } from 'react';
import { Mail, CreditCard, Loader2, User, Calendar, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { createPatientPortalToken } from '@/lib/auth';
import { getPatientByEmailAndTaj, addPatient } from '@/lib/storage';
import { Patient } from '@/lib/types';

export function PortalLogin() {
  const [step, setStep] = useState<'check' | 'register'>('check');
  const [email, setEmail] = useState('');
  const [taj, setTaj] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Registration fields
  const [nev, setNev] = useState('');
  const [telefonszam, setTelefonszam] = useState('');
  const [szuletesiDatum, setSzuletesiDatum] = useState('');
  const [nem, setNem] = useState<'ferfi' | 'no' | 'nem_ismert' | ''>('');
  const [cim, setCim] = useState('');
  const [varos, setVaros] = useState('');
  const [iranyitoszam, setIranyitoszam] = useState('');
  
  const { showToast } = useToast();

  // Format TAJ number: xxx-xxx-xxx (max 9 digits)
  const formatTaj = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 9);
    
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    } else {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    }
  };

  const handleTajChange = (value: string) => {
    const formatted = formatTaj(value);
    setTaj(formatted);
  };

  const handleCheckPatient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !taj.trim()) {
      showToast('Kérjük, töltse ki mindkét mezőt', 'error');
      return;
    }

    setChecking(true);

    try {
      const tajClean = taj.replace(/-/g, '');
      const patient = await getPatientByEmailAndTaj(email.trim(), tajClean);

      if (patient) {
        // Patient exists - create token and simulate magic link
        await requestMagicLink();
      } else {
        // New patient - show registration form
        setStep('register');
      }
    } catch (error) {
      console.error('Error checking patient:', error);
      showToast('Hiba történt', 'error');
    } finally {
      setChecking(false);
    }
  };

  const requestMagicLink = async () => {
    setLoading(true);

    try {
      const tajClean = taj.replace(/-/g, '');
      let patient: Patient | null = null;

      if (step === 'register') {
        // Create new patient
        const newPatient: Patient = {
          id: crypto.randomUUID(), // This will be ignored by the API, but required for type
          nev: nev.trim() || null,
          taj: tajClean,
          email: email.trim(),
          telefonszam: telefonszam.trim() || null,
          szuletesiDatum: szuletesiDatum || null,
          nem: nem || null,
          cim: cim.trim() || null,
          varos: varos.trim() || null,
          iranyitoszam: iranyitoszam.trim() || null,
          beutaloOrvos: null,
          beutaloIndokolas: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        // The API returns the patient with the database-generated ID
        patient = await addPatient(newPatient);
      } else {
        patient = await getPatientByEmailAndTaj(email.trim(), tajClean);
      }

      if (!patient) {
        throw new Error('Páciens nem található');
      }

      // Create token
      const token = await createPatientPortalToken(email.trim(), tajClean, patient.id);
      
      // Send magic link email
      try {
        const emailResponse = await fetch('/api/email/magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            token,
          }),
        });

        if (emailResponse.ok) {
          const responseData = await emailResponse.json();
          showToast('Bejelentkezési link elküldve az email címére. Kérjük, ellenőrizze email fiókját és kattintson a linkre a bejelentkezéshez.', 'success');
          // Clear form after successful email send
          setEmail('');
          setTaj('');
          setNev('');
          setTelefonszam('');
          setSzuletesiDatum('');
          setNem('nem_ismert');
          setCim('');
          setVaros('');
          setIranyitoszam('');
        } else {
          const errorData = await emailResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Az email küldése sikertelen volt';
          showToast(errorMessage, 'error');
          // Don't throw - just show error, keep form data
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        showToast(
          emailError instanceof Error 
            ? emailError.message 
            : 'Hiba történt az email küldése során. Kérjük, próbálja újra később.',
          'error'
        );
        // Don't throw - just show error, keep form data
      }
    } catch (error) {
      console.error('Error requesting magic link:', error);
      showToast(
        error instanceof Error ? error.message : 'Hiba történt a bejelentkezési link kérésekor',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestMagicLink();
  };

  if (step === 'register') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Regisztráció
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Kérjük, töltse ki az alábbi adatokat az időpontfoglaláshoz.
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Alapadatok</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email cím <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="pelda@email.hu"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="taj" className="form-label flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  TAJ szám <span className="text-red-500">*</span>
                </label>
                <input
                  id="taj"
                  type="text"
                  value={taj}
                  onChange={(e) => handleTajChange(e.target.value)}
                  className="form-input"
                  placeholder="123-456-789"
                  required
                  disabled={loading}
                  maxLength={11}
                />
              </div>

              <div>
                <label htmlFor="nev" className="form-label flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Teljes név <span className="text-red-500">*</span>
                </label>
                <input
                  id="nev"
                  type="text"
                  value={nev}
                  onChange={(e) => setNev(e.target.value)}
                  className="form-input"
                  placeholder="Kovács János"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="szuletesiDatum" className="form-label flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Születési dátum
                  </label>
                  <input
                    id="szuletesiDatum"
                    type="date"
                    value={szuletesiDatum}
                    onChange={(e) => setSzuletesiDatum(e.target.value)}
                    className="form-input"
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label htmlFor="nem" className="form-label">
                    Nem
                  </label>
                  <select
                    id="nem"
                    value={nem}
                    onChange={(e) => setNem(e.target.value as 'ferfi' | 'no' | 'nem_ismert' | '')}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Válasszon...</option>
                    <option value="ferfi">Férfi</option>
                    <option value="no">Nő</option>
                    <option value="nem_ismert">Nem ismert</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="telefonszam" className="form-label flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefonszám
                </label>
                <input
                  id="telefonszam"
                  type="tel"
                  value={telefonszam}
                  onChange={(e) => setTelefonszam(e.target.value)}
                  className="form-input"
                  placeholder="+36-30-123-4567"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Lakcím</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="cim" className="form-label flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Cím
                </label>
                <input
                  id="cim"
                  type="text"
                  value={cim}
                  onChange={(e) => setCim(e.target.value)}
                  className="form-input"
                  placeholder="Utca, házszám"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="varos" className="form-label">
                    Város
                  </label>
                  <input
                    id="varos"
                    type="text"
                    value={varos}
                    onChange={(e) => setVaros(e.target.value)}
                    className="form-input"
                    placeholder="Budapest"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="iranyitoszam" className="form-label">
                    Irányítószám
                  </label>
                  <input
                    id="iranyitoszam"
                    type="text"
                    value={iranyitoszam}
                    onChange={(e) => setIranyitoszam(e.target.value)}
                    className="form-input"
                    placeholder="1011"
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('check')}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Vissza
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Küldés...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Regisztráció és link küldése
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Bejelentkezés
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Adja meg email címét és TAJ számát. Bejelentkezési linket küldünk emailben. Ha még nem regisztrált, automatikusan létrehozzuk a fiókját.
      </p>

      <form onSubmit={handleCheckPatient} className="space-y-4">
        <div>
          <label htmlFor="email-check" className="form-label flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email cím
          </label>
          <input
            id="email-check"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="pelda@email.hu"
            required
            disabled={checking || loading}
          />
        </div>

        <div>
          <label htmlFor="taj-check" className="form-label flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            TAJ szám
          </label>
          <input
            id="taj-check"
            type="text"
            value={taj}
            onChange={(e) => handleTajChange(e.target.value)}
            className="form-input"
            placeholder="123-456-789"
            required
            disabled={checking || loading}
            maxLength={11}
          />
          <p className="text-xs text-gray-500 mt-1">
            Formátum: XXX-XXX-XXX (9 számjegy)
          </p>
        </div>

        <button
          type="submit"
          disabled={checking || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Ellenőrzés...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Bejelentkezési link küldése
            </>
          )}
        </button>
      </form>
    </div>
  );
}

