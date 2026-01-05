'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyDentistPassword, setDentistSession, isDentistAuthenticated } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init';
import { Logo } from '@/components/Logo';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        if (isDentistAuthenticated()) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error initializing:', error);
        showToast('Hiba történt az inicializálás során', 'error');
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isValid = await verifyDentistPassword(password);
      if (isValid) {
        setDentistSession();
        router.push('/scheduler');
      } else {
        showToast('Hibás jelszó', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Hiba történt a bejelentkezés során', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Inicializálás...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <Logo width={60} height={69} />
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">
              König Fogászat
            </h1>
            <p className="text-sm text-gray-600">Bejelentkezés</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="form-label">
              Jelszó
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full"
              placeholder="Adja meg a jelszavát"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Alapértelmezett jelszó: admin
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  );
}

