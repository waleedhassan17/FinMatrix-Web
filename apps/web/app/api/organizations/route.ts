import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@finmatrix/auth';
import { createTenant, getUserTenants } from '@finmatrix/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, ntn, strn, settings } = body;

    // Validate required fields
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Organization name is required (min 2 characters)' },
        { status: 400 }
      );
    }

    // Validate NTN format if provided
    if (ntn && !/^\d{7}-\d$/.test(ntn)) {
      return NextResponse.json(
        { error: 'Invalid NTN format. Expected: XXXXXXX-X' },
        { status: 400 }
      );
    }

    // Validate STRN format if provided
    if (strn && !/^\d{13}$/.test(strn)) {
      return NextResponse.json(
        { error: 'Invalid STRN format. Expected: 13 digits' },
        { status: 400 }
      );
    }

    // Create tenant with isolated schema
    const tenant = await createTenant({
      name,
      ownerId: session.user.id,
      ntn: ntn || undefined,
      strn: strn || undefined,
    });

    return NextResponse.json(
      {
        message: 'Organization created successfully',
        organization: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Organization creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizations = await getUserTenants(session.user.id);

    return NextResponse.json({
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        isOwner: org.isOwner,
        createdAt: org.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
