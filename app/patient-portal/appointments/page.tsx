'use client';

import { PortalLayout } from '@/components/patient-portal/PortalLayout';
import { PatientAppointmentsList } from '@/components/patient-portal/PatientAppointmentsList';

export default function AppointmentsPage() {
  return (
    <PortalLayout>
      <PatientAppointmentsList />
    </PortalLayout>
  );
}

