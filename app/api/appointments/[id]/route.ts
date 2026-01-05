import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Appointment } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

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
      WHERE a.id = $1
      LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
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
      patientId,
      timeSlotId,
      startTime,
      patientName,
      patientTaj,
      appointmentStatus,
      appointmentType,
      approvalStatus,
      completionNotes,
      isLate,
      cim,
      createdBy,
    } = body;

    const result = await query<Appointment>(
      `UPDATE appointments
      SET 
        patient_id = COALESCE($1, patient_id),
        time_slot_id = COALESCE($2, time_slot_id),
        start_time = COALESCE($3, start_time),
        patient_name = $4,
        patient_taj = $5,
        appointment_status = $6,
        appointment_type = $7,
        approval_status = $8,
        completion_notes = $9,
        is_late = COALESCE($10, is_late),
        cim = $11,
        created_by = $12
      WHERE id = $13
      RETURNING 
        id,
        patient_id as "patientId",
        time_slot_id as "timeSlotId",
        start_time as "startTime",
        patient_name as "patientName",
        patient_taj as "patientTaj",
        dentist_email as "dentistEmail",
        dentist_name as "dentistName",
        appointment_status as "appointmentStatus",
        appointment_type as "appointmentType",
        approval_status as "approvalStatus",
        completion_notes as "completionNotes",
        is_late as "isLate",
        cim,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [
        patientId || null,
        timeSlotId || null,
        startTime || null,
        patientName || null,
        patientTaj || null,
        appointmentStatus || null,
        appointmentType || null,
        approvalStatus || null,
        completionNotes || null,
        isLate || null,
        cim || null,
        createdBy || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
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
      'DELETE FROM appointments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}

