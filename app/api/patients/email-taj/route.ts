import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Patient } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, taj } = body;

    if (!email || !taj) {
      return NextResponse.json(
        { error: 'email and taj are required' },
        { status: 400 }
      );
    }

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
      WHERE email = $1 AND taj = $2
      LIMIT 1`,
      [email, taj]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient by email and taj:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

