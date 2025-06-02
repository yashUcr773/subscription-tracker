import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const subscriptionId = params.id;
    const body = await request.json();

    // Verify the subscription belongs to the user
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: user.id
      }
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        amount: body.amount,
        currency: body.currency,
        billingFrequency: body.billingFrequency,
        nextBillingDate: new Date(body.nextBillingDate),
        lastBillingDate: body.lastBillingDate ? new Date(body.lastBillingDate) : null,
        website: body.website,
        status: body.status
      }
    });

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const subscriptionId = params.id;

    // Verify the subscription belongs to the user
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: user.id
      }
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    await prisma.subscription.delete({
      where: { id: subscriptionId }
    });

    return NextResponse.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
