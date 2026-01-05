'use client';

import { PortalLogin } from '@/components/patient-portal/PortalLogin';
import { Logo } from '@/components/Logo';

export default function PatientPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <Logo width={60} height={69} />
            <div className="ml-4">
              <h1 className="text-xl sm:text-2xl font-bold text-medical-primary">
                König Fogászat
              </h1>
              <p className="text-sm text-gray-600">Páciens portál</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900 font-medium">
                Ha Ön páciens, kérem adja meg email címét és TAJ számát a bejelentkezéshez.
              </p>
            </div>
          </div>

          <PortalLogin />
        </div>
      </main>
    </div>
  );
}

