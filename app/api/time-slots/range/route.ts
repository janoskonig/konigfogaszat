import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TimeSlot } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

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
      WHERE start_time >= $1 AND start_time <= $2
      ORDER BY start_time ASC`,
      [startDate, endDate]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching time slots by range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

