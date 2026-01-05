import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Patient } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
      WHERE id = $1
      LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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
      `UPDATE patients
      SET 
        nev = $1,
        taj = $2,
        email = $3,
        telefonszam = $4,
        szuletesi_datum = $5,
        nem = $6,
        cim = $7,
        varos = $8,
        iranyitoszam = $9,
        beutalo_orvos = $10,
        beutalo_indokolas = $11
      WHERE id = $12
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const result = await query(
      'DELETE FROM patients WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}

