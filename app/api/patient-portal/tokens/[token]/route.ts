import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PatientPortalToken } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token);

    const result = await query<PatientPortalToken>(
      `SELECT 
        id,
        token,
        patient_id as "patientId",
        email,
        taj,
        expires_at as "expiresAt",
        used,
        created_at as "createdAt"
      FROM patient_portal_tokens
      WHERE token = $1
      LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient portal token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token);
    const body = await request.json();
    const { used, patientId } = body;

    const result = await query<PatientPortalToken>(
      `UPDATE patient_portal_tokens
      SET 
        used = COALESCE($1, used),
        patient_id = COALESCE($2, patient_id)
      WHERE token = $3
      RETURNING 
        id,
        token,
        patient_id as "patientId",
        email,
        taj,
        expires_at as "expiresAt",
        used,
        created_at as "createdAt"`,
      [used !== undefined ? used : null, patientId || null, token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient portal token:', error);
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    );
  }
}

