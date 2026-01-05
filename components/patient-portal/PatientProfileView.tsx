'use client';

import { Patient } from '@/lib/types';

interface PatientProfileViewProps {
  patient: Patient;
}

export function PatientProfileView({ patient }: PatientProfileViewProps) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Személyes adatok</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Név</label>
          <p className="text-sm text-gray-900 mt-1">{patient.nev || '-'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">TAJ szám</label>
          <p className="text-sm text-gray-900 mt-1">{patient.taj || '-'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Email</label>
          <p className="text-sm text-gray-900 mt-1">{patient.email || '-'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Telefonszám</label>
          <p className="text-sm text-gray-900 mt-1">{patient.telefonszam || '-'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Születési dátum</label>
          <p className="text-sm text-gray-900 mt-1">
            {patient.szuletesiDatum 
              ? new Date(patient.szuletesiDatum).toLocaleDateString('hu-HU')
              : '-'}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Nem</label>
          <p className="text-sm text-gray-900 mt-1">
            {patient.nem === 'ferfi' ? 'Férfi' : patient.nem === 'no' ? 'Nő' : '-'}
          </p>
        </div>
        {(patient.cim || patient.varos || patient.iranyitoszam) && (
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500">Lakcím</label>
            <p className="text-sm text-gray-900 mt-1">
              {[patient.cim, patient.varos, patient.iranyitoszam].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

