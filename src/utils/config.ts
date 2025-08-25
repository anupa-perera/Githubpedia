/**
 * Configuration utilities for environment variables and app settings
 */

export interface AppConfig {
  github: {
    token: string; // Required for all GitHub operations
    clientId: string;
    clientSecret: string;
  };
  auth: {
    secret: string;
    url: string;
  };
  app: {
    baseUrl: string;
    environment: 'development' | 'production' | 'test';
  };
}

/**
 * Get application configuration from environment variables
 * Throws error if required environment variables are missing
 */
export function getConfig(): AppConfig {
  const validation = validateConfig();
  if (!validation.valid) {
    throw new Error(
      `Missing required environment variables: ${validation.missing.join(', ')}`
    );
  }

  return {
    github: {
      token: process.env.GITHUB_TOKEN || '', // Optional for server-side operations
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    auth: {
      secret: process.env.NEXTAUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
    },
    app: {
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      environment:
        (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
        'development',
    },
  };
}

/**
 * Validate required environment variables
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // GitHub OAuth credentials are required
  if (!process.env.GITHUB_CLIENT_ID) {
    missing.push('GITHUB_CLIENT_ID');
  }
  if (!process.env.GITHUB_CLIENT_SECRET) {
    missing.push('GITHUB_CLIENT_SECRET');
  }

  // NextAuth configuration is required
  if (!process.env.NEXTAUTH_SECRET) {
    missing.push('NEXTAUTH_SECRET');
  }
  if (!process.env.NEXTAUTH_URL) {
    missing.push('NEXTAUTH_URL');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
