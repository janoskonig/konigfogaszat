import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PatientPortalSession } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, patientId, email, expiresAt } = body;

    if (!sessionId || !patientId || !email || !expiresAt) {
      return NextResponse.json(
        { error: 'sessionId, patientId, email, and expiresAt are required' },
        { status: 400 }
      );
    }

    const result = await query<PatientPortalSession>(
      `INSERT INTO patient_portal_sessions 
        (id, session_id, patient_id, email, expires_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING 
        id,
        session_id as "sessionId",
        patient_id as "patientId",
        email,
        created_at as "createdAt",
        expires_at as "expiresAt"`,
      [sessionId, patientId, email, expiresAt]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating patient portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

