import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/onesignal';

export async function POST(req: NextRequest) {
  try {
    const { title, message, targetUids } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    const result = await sendNotification({ title, message, targetUids });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
