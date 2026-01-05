'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, FileText, Home } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { clearPatientPortalSession, getPatientPortalSession } from '@/lib/auth';
import { deletePatientPortalSession } from '@/lib/storage';

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const sessionId = getPatientPortalSession();
    if (sessionId) {
      await deletePatientPortalSession(sessionId);
    }
    clearPatientPortalSession();
    router.push('/patient-portal');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Logo width={40} height={46} />
              <div>
              <h1 className="text-xl font-bold text-medical-primary">
                König Fogászat
              </h1>
                <p className="text-sm text-gray-600">Páciens portál</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Kijelentkezés
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <a
              href="/patient-portal/dashboard"
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent hover:border-blue-500 text-gray-600 hover:text-blue-600"
            >
              <Home className="w-4 h-4" />
              Főoldal
            </a>
            <a
              href="/patient-portal/appointments"
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent hover:border-blue-500 text-gray-600 hover:text-blue-600"
            >
              <Calendar className="w-4 h-4" />
              Időpontok
            </a>
            <a
              href="/patient-portal/documents"
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent hover:border-blue-500 text-gray-600 hover:text-blue-600"
            >
              <FileText className="w-4 h-4" />
              Dokumentumok
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

