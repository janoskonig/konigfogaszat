import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Patient } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParam = searchParams.get('q');

    if (!queryParam) {
      return NextResponse.json(
        { error: 'q query parameter is required' },
        { status: 400 }
      );
    }

    const searchTerm = `%${queryParam.toLowerCase()}%`;

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
      WHERE 
        LOWER(nev) LIKE $1 OR
        LOWER(email) LIKE $1 OR
        taj LIKE $2 OR
        telefonszam LIKE $2
      ORDER BY created_at DESC`,
      [searchTerm, `%${queryParam}%`]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients' },
      { status: 500 }
    );
  }
}

