import { getServerSession } from 'next-auth/next';
import { AuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import { AuthenticatedUser } from '../types/auth';

export const authOptions: AuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo read:org',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

/**
 * Get the current authenticated user session
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !session.accessToken) {
    return null;
  }

  return {
    id: session.user.email || session.user.name || '',
    login: session.user.name || '',
    name: session.user.name || '',
    email: session.user.email || '',
    avatar_url: session.user.image || '',
    accessToken: session.accessToken,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get GitHub access token from session
 */
export async function getGitHubToken(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.accessToken || null;
}