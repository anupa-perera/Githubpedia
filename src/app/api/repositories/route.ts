import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/utils/auth';
import { parseGitHubUrl } from '@/utils/githubUtils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get('url');

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    const repoInfo = parseGitHubUrl(repoUrl);
    if (!repoInfo) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    // Fetch repository information from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Developer-Wiki',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or not accessible' },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'Access forbidden - check repository permissions' },
          { status: 403 }
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repoData = await response.json();

    // Return formatted repository information
    return NextResponse.json({
      id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      owner: {
        login: repoData.owner.login,
        avatar_url: repoData.owner.avatar_url,
      },
      description: repoData.description,
      private: repoData.private,
      html_url: repoData.html_url,
      updated_at: repoData.updated_at,
      language: repoData.language,
      stargazers_count: repoData.stargazers_count,
      forks_count: repoData.forks_count,
      open_issues_count: repoData.open_issues_count,
      default_branch: repoData.default_branch,
      topics: repoData.topics || [],
    });
  } catch (error) {
    console.error('Error fetching repository information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository information' },
      { status: 500 }
    );
  }
}
