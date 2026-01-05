import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PatientPortalToken } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, patientId, email, taj, expiresAt, used = false } = body;

    if (!token || !email || !taj || !expiresAt) {
      return NextResponse.json(
        { error: 'token, email, taj, and expiresAt are required' },
        { status: 400 }
      );
    }

    const result = await query<PatientPortalToken>(
      `INSERT INTO patient_portal_tokens 
        (id, token, patient_id, email, taj, expires_at, used)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        token,
        patient_id as "patientId",
        email,
        taj,
        expires_at as "expiresAt",
        used,
        created_at as "createdAt"`,
      [token, patientId || null, email, taj, expiresAt, used]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating patient portal token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}

