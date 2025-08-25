# Deployment Guide

## Vercel Deployment

This application is configured for deployment on Vercel, the platform created by the makers of Next.js.

### Prerequisites

1. **Vercel CLI** (optional, for command-line deployment):

   ```bash
   npm install -g vercel
   ```

2. **Environment Variables**: Ensure you have the following environment variables configured:
   - `GITHUB_TOKEN` - GitHub Personal Access Token
   - `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID
   - `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret
   - `NEXTAUTH_SECRET` - NextAuth secret key
   - `NEXTAUTH_URL` - Your production URL
   - `ENCRYPTION_SECRET` - 32-character encryption secret

### Deployment Methods

#### Method 1: Vercel Dashboard (Recommended)

1. Visit [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables in the Vercel dashboard
6. Deploy

#### Method 2: Vercel CLI

1. **Login to Vercel**:

   ```bash
   vercel login
   ```

2. **Deploy to preview**:

   ```bash
   npm run deploy:preview
   ```

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

#### Method 3: Git Integration (Automatic)

Once connected to Vercel:

- Push to `main` branch → automatic production deployment
- Push to other branches → automatic preview deployments

### Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-app-name.vercel.app
ENCRYPTION_SECRET=your_32_character_encryption_secret
```

### GitHub OAuth Configuration

Update your GitHub OAuth App settings:

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Update the Authorization callback URL to: `https://your-app-name.vercel.app/api/auth/callback/github`
3. Update the Homepage URL to: `https://your-app-name.vercel.app`

### Build Configuration

The application uses the following build settings (automatically detected by Vercel):

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Custom Domain (Optional)

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `NEXTAUTH_URL` environment variable

### Monitoring and Analytics

Vercel provides built-in:

- Performance monitoring
- Error tracking
- Analytics
- Function logs

Access these through your Vercel dashboard.

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required variables are set
3. **GitHub OAuth**: Verify callback URLs match your deployment URL
4. **API Routes**: Check function logs for serverless function errors

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
