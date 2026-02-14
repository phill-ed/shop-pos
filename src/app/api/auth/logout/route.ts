// Logout API route
import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession, auditLog } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await request.headers.get('cookie');
    const token = cookieStore?.match(/auth-token=([^;]+)/)?.[1];

    if (token) {
      const session = await getSession();
      if (session) {
        await auditLog({
          userId: session.userId,
          action: 'LOGOUT',
          entity: 'user',
          entityId: session.userId,
        });
      }
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
