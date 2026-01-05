import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Appointment } from '@/lib/types';

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

    const result = await query<Appointment>(
      `SELECT 
        a.id,
        a.patient_id as "patientId",
        a.time_slot_id as "timeSlotId",
        a.start_time as "startTime",
        a.patient_name as "patientName",
        a.patient_taj as "patientTaj",
        a.dentist_email as "dentistEmail",
        a.dentist_name as "dentistName",
        a.appointment_status as "appointmentStatus",
        a.appointment_type as "appointmentType",
        a.approval_status as "approvalStatus",
        a.completion_notes as "completionNotes",
        a.is_late as "isLate",
        a.cim,
        a.created_by as "createdBy",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt"
      FROM appointments a
      WHERE a.start_time >= $1 AND a.start_time <= $2
      ORDER BY a.start_time ASC`,
      [startDate, endDate]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments by range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

