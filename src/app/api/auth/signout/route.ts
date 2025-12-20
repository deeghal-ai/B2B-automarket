import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Get the origin from the request or use localhost as fallback
  const origin = request.headers.get('origin') || 'http://localhost:3000';

  return NextResponse.redirect(new URL('/login', origin), {
    status: 302,
  });
}
