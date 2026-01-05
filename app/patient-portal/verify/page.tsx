'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPatientPortalToken, createPatientPortalSession } from '@/lib/auth';
import { setPatientPortalSession } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Hiányzó token');
        setLoading(false);
        return;
      }

      try {
        const tokenData = await verifyPatientPortalToken(token);
        
        if (!tokenData || !tokenData.patientId) {
          setError('Érvénytelen vagy lejárt token');
          setLoading(false);
          return;
        }

        // Create session
        const sessionId = await createPatientPortalSession(
          tokenData.patientId,
          tokenData.email
        );
        setPatientPortalSession(sessionId);

        // Redirect to dashboard
        router.push('/patient-portal/dashboard');
      } catch (err) {
        console.error('Token verification error:', err);
        setError('Hiba történt a token ellenőrzése során');
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, router, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Token ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hiba</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/patient-portal"
            className="btn-primary inline-block"
          >
            Vissza a bejelentkezéshez
          </a>
        </div>
      </div>
    );
  }

  return null;
}

