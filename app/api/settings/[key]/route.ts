import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Settings } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);

    const result = await query<Settings>(
      `SELECT 
        id,
        key,
        value,
        updated_at as "updatedAt"
      FROM settings
      WHERE key = $1
      LIMIT 1`,
      [key]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ value: null });
    }

    return NextResponse.json({ value: result.rows[0].value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json(
        { error: 'value is required' },
        { status: 400 }
      );
    }

    const result = await query<Settings>(
      `INSERT INTO settings (id, key, value, updated_at)
      VALUES (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING 
        id,
        key,
        value,
        updated_at as "updatedAt"`,
      [key, value]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

