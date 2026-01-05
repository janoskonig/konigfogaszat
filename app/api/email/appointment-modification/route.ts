import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, generateAppointmentModificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientEmail, patientName, oldDate, newDate, dentistName, address, room } = body;

    if (!patientEmail || !patientName || !oldDate || !newDate) {
      return NextResponse.json(
        { error: 'Missing required fields: patientEmail, patientName, oldDate, newDate' },
        { status: 400 }
      );
    }

    const { subject, html } = generateAppointmentModificationEmail(
      patientName,
      oldDate,
      newDate,
      dentistName || 'dr. König János',
      address || '5600 Békéscsaba, Kolozsvári utca 3',
      room
    );

    const success = await sendEmail({ to: patientEmail, subject, html });

    if (success) {
      return NextResponse.json({ success: true, message: 'Appointment modification email sent' });
    } else {
      return NextResponse.json(
        { error: 'Email service not configured or failed to send' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending appointment modification email:', error);
    return NextResponse.json(
      { error: 'Failed to send appointment modification email' },
      { status: 500 }
    );
  }
}

