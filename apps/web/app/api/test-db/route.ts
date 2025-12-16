import { NextResponse } from 'next/server';
import { db, sql } from '@finmatrix/db';

export async function GET() {
  try {
    // Test database connection with a simple query
    const result = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`);

    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      database: {
        currentTime: result.rows[0]?.current_time,
        version: result.rows[0]?.pg_version,
      },
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
