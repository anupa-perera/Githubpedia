import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}

export interface AuthenticatedUser {
  id: string;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  accessToken: string;
}
