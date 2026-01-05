import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Patient } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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
      ORDER BY created_at DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nev,
      taj,
      email,
      telefonszam,
      szuletesiDatum,
      nem,
      cim,
      varos,
      iranyitoszam,
      beutaloOrvos,
      beutaloIndokolas,
    } = body;

    const result = await query<Patient>(
      `INSERT INTO patients 
        (id, nev, taj, email, telefonszam, szuletesi_datum, nem, 
         cim, varos, iranyitoszam, beutalo_orvos, beutalo_indokolas)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
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
        updated_at as "updatedAt"`,
      [
        nev || null,
        taj || null,
        email || null,
        telefonszam || null,
        szuletesiDatum || null,
        nem || null,
        cim || null,
        varos || null,
        iranyitoszam || null,
        beutaloOrvos || null,
        beutaloIndokolas || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}

