'use client';

import { PortalLayout } from '@/components/patient-portal/PortalLayout';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-medical-primary" />
            Dokumentumok
          </h1>
          <p className="text-gray-600 mt-2">
            Itt találhatja a dokumentumait.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nincsenek dokumentumok
          </h3>
          <p className="text-gray-600">
            Jelenleg nincsenek feltöltött dokumentumok.
          </p>
        </div>
      </div>
    </PortalLayout>
  );
}

