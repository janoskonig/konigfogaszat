'use client';

import { PortalLayout } from '@/components/patient-portal/PortalLayout';
import { PortalDashboard } from '@/components/patient-portal/PortalDashboard';

export default function DashboardPage() {
  return (
    <PortalLayout>
      <PortalDashboard />
    </PortalLayout>
  );
}

