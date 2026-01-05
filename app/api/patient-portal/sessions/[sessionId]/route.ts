import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PatientPortalSession } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = decodeURIComponent(params.sessionId);

    const result = await query<PatientPortalSession>(
      `SELECT 
        id,
        session_id as "sessionId",
        patient_id as "patientId",
        email,
        created_at as "createdAt",
        expires_at as "expiresAt"
      FROM patient_portal_sessions
      WHERE session_id = $1
      LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient portal session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = decodeURIComponent(params.sessionId);

    const result = await query(
      'DELETE FROM patient_portal_sessions WHERE session_id = $1 RETURNING id',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient portal session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

