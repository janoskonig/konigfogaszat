import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TimeSlot } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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
      ORDER BY start_time ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      startTime,
      status = 'available',
      cim,
      userEmail,
    } = body;

    if (!startTime) {
      return NextResponse.json(
        { error: 'startTime is required' },
        { status: 400 }
      );
    }

    const DENTIST_NAME = 'dr. König János';
    const DENTIST_EMAIL = 'drkonigjanos@gmail.com';

    const result = await query<TimeSlot>(
      `INSERT INTO time_slots 
        (id, start_time, status, cim, dentist_name, dentist_email, user_email)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
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
      [startTime, status, cim || null, DENTIST_NAME, DENTIST_EMAIL, userEmail || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}

