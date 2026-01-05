import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Patient } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    const result = await query<Patient>(
      `SELECT 
        id,
        nev,
        taj,
        email,
        telefonszam,
        szuletesi_datum as "szuletesiDatum",
        nem,
        cim,
        varos,
        iranyitoszam,
        beutalo_orvos as "beutaloOrvos",
        beutalo_indokolas as "beutaloIndokolas",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM patients
      WHERE email = $1
      LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

