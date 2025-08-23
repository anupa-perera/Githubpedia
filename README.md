# Githubpedia

A Next.js application that provides an intelligent interface for exploring GitHub repositories using AI-powered chat and MCP (Model Context Protocol) integration.

## 🚀 Live Demo

**Production URL**: https://githubpedia-hjlymty9g-anupaxtream-5314s-projects.vercel.app

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚀 Deployment

### Quick Deploy Commands

```bash
# Deploy to preview
npm run deploy:preview

# Deploy to production
npm run deploy
```

### Environment Variables Required

Before deploying, ensure you have these environment variables configured:

- `GITHUB_TOKEN` - GitHub Personal Access Token
- `GITHUB_CLIENT_ID` - GitHub OAuth App Client ID  
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App Client Secret
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Your production URL
- `ENCRYPTION_SECRET` - 32-character encryption secret

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
