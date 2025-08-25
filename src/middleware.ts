import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/query/:path*',
    '/api/repositories/:path*',
  ],
};
