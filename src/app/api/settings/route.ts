import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user settings or return default values
    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    }) || {
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      budgetAlerts: true,
      duplicateDetection: true
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        theme: body.theme,
        emailNotifications: body.emailNotifications,
        pushNotifications: body.pushNotifications,
        budgetAlerts: body.budgetAlerts,
        duplicateDetection: body.duplicateDetection
      },
      create: {
        userId: user.id,
        theme: body.theme ?? 'light',
        emailNotifications: body.emailNotifications ?? true,
        pushNotifications: body.pushNotifications ?? true,
        budgetAlerts: body.budgetAlerts ?? true,
        duplicateDetection: body.duplicateDetection ?? true
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
