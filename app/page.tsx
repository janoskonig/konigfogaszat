'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyDentistPassword, setDentistSession } from '@/lib/auth';
import { initializeDatabase } from '@/lib/init';
import { Logo } from '@/components/Logo';
import { useToast } from '@/contexts/ToastContext';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [dentistPassword, setDentistPassword] = useState('');
  const [dentistLoading, setDentistLoading] = useState(false);
  const { showToast } = useToast();

  const handleDentistLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDentistLoading(true);

    try {
      await initializeDatabase();
      const isValid = await verifyDentistPassword(dentistPassword);
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
      setDentistLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Logo width={80} height={92} />
            <div className="ml-6">
              <h1 className="text-4xl font-bold text-medical-primary">
                König Fogászat
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                5600 Békéscsaba, Kolozsvári utca 3
              </p>
              <p className="text-sm text-gray-500 mt-1">
                id. dr. König János
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Orvosi bejelentkezés - Bal oldal */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orvosi bejelentkezés</h2>
                <p className="text-sm text-gray-600">Időpontkezelő rendszer</p>
              </div>
            </div>

            <form onSubmit={handleDentistLogin} className="space-y-4">
              <div>
                <label htmlFor="dentist-password" className="form-label flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Jelszó
                </label>
                <input
                  id="dentist-password"
                  type="password"
                  value={dentistPassword}
                  onChange={(e) => setDentistPassword(e.target.value)}
                  className="form-input w-full"
                  placeholder="Adja meg a jelszavát"
                  required
                  disabled={dentistLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alapértelmezett jelszó: admin
                </p>
              </div>

              <button
                type="submit"
                disabled={dentistLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {dentistLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Bejelentkezés...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Bejelentkezés</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Páciens portál - Jobb oldal */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Páciens portál</h2>
                <p className="text-sm text-gray-600">Időpontfoglalás és információk</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  A páciens portál eléréséhez kattintson az alábbi gombra. Email cím és TAJ szám megadásával jelentkezhet be.
                </p>
              </div>

              <a
                href="/patient-portal"
                className="btn-primary w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 no-underline"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Páciens portál megnyitása</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            König Fogászat - 5600 Békéscsaba, Kolozsvári utca 3
          </p>
          <p className="text-xs text-gray-500 mt-2">
            id. dr. König János
          </p>
        </div>
      </div>
    </div>
  );
}
