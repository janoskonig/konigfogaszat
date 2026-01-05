import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateAppointmentCancellationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientEmail, patientName, appointmentDate, cancelledBy } = body;

    if (!patientEmail || !patientName || !appointmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields: patientEmail, patientName, appointmentDate' },
        { status: 400 }
      );
    }

    const { subject, html } = generateAppointmentCancellationEmail(
      patientName,
      appointmentDate,
      cancelledBy || 'doctor'
    );

    const success = await sendEmail({ to: patientEmail, subject, html });

    if (success) {
      return NextResponse.json({ success: true, message: 'Appointment cancellation email sent' });
    } else {
      return NextResponse.json(
        { error: 'Email service not configured or failed to send' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending appointment cancellation email:', error);
    return NextResponse.json(
      { error: 'Failed to send appointment cancellation email' },
      { status: 500 }
    );
  }
}

