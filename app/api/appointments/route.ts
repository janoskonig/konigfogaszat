import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Appointment } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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
      ORDER BY a.start_time DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!patientId || !timeSlotId || !startTime) {
      return NextResponse.json(
        { error: 'patientId, timeSlotId, and startTime are required' },
        { status: 400 }
      );
    }

    const DENTIST_NAME = 'dr. König János';
    const DENTIST_EMAIL = 'drkonigjanos@gmail.com';

    const result = await query<Appointment>(
      `INSERT INTO appointments 
        (id, patient_id, time_slot_id, start_time, patient_name, patient_taj, 
         dentist_email, dentist_name, appointment_status, appointment_type, 
         approval_status, completion_notes, is_late, cim, created_by)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        patientId,
        timeSlotId,
        startTime,
        patientName || null,
        patientTaj || null,
        DENTIST_EMAIL,
        DENTIST_NAME,
        appointmentStatus || null,
        appointmentType || null,
        approvalStatus || null,
        completionNotes || null,
        isLate || false,
        cim || null,
        createdBy || null,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

