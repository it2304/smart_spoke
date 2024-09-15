import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { createUser } from '@/lib/user';
import { NextResponse } from 'next/server';

const afterCallback = async (req, session) => {
  console.log('afterCallback called', session?.user);
  if (session?.user) {
    try {
      await createUser(session.user);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }
  return session;
};

export const GET = handleAuth({
  login: handleLogin,
  callback: async (req, res) => {
    try {
      return await handleCallback(req, res, { afterCallback });
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
  },
  logout: handleLogout,
});

export const POST = GET;