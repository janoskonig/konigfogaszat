import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TimeSlot } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const result = await query<TimeSlot>(
      `SELECT 
        id,
        start_time as "startTime",
        status,
        cim,
        dentist_name as "dentistName",
        dentist_email as "dentistEmail",
        user_email as "userEmail",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM time_slots
      WHERE id = $1
      LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching time slot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slot' },
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
      startTime,
      status,
      cim,
      userEmail,
    } = body;

    const result = await query<TimeSlot>(
      `UPDATE time_slots
      SET 
        start_time = COALESCE($1, start_time),
        status = COALESCE($2, status),
        cim = $3,
        user_email = $4
      WHERE id = $5
      RETURNING 
        id,
        start_time as "startTime",
        status,
        cim,
        dentist_name as "dentistName",
        dentist_email as "dentistEmail",
        user_email as "userEmail",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [startTime || null, status || null, cim || null, userEmail || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to update time slot' },
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
      'DELETE FROM time_slots WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete time slot' },
      { status: 500 }
    );
  }
}

