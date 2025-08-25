import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { processQuery } from '@/services/queryService';
import { QueryRequest, QueryResponse } from '@/types/query';
import { authOptions } from '@/utils/auth';
import { decryptApiKey } from '@/utils/encryption';
import { parseGitHubUrl } from '@/utils/githubUtils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: QueryRequest = await request.json();
    const { repositoryUrl, query } = body;

    // Validate input
    if (!repositoryUrl || !query) {
      return NextResponse.json(
        { error: 'Repository URL and query are required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const repoInfo = parseGitHubUrl(repositoryUrl);
    if (!repoInfo) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    // Get LLM configuration from cookies
    const llmConfigCookie = request.cookies.get('llm-config');
    if (!llmConfigCookie) {
      return NextResponse.json(
        {
          error:
            'LLM configuration required. Please configure your AI provider first.',
        },
        { status: 400 }
      );
    }

    let llmConfig;
    try {
      llmConfig = JSON.parse(llmConfigCookie.value);
      // Decrypt the API key
      llmConfig.apiKey = decryptApiKey(llmConfig.encryptedApiKey);
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid LLM configuration. Please reconfigure your AI provider.',
        },
        { status: 400 }
      );
    }

    // Use the GitHub token from session
    const githubToken = session.accessToken;

    // Process the query using LangChain orchestration
    const result = await processQuery({
      repository: repoInfo,
      query,
      githubToken,
      llmConfig,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response: QueryResponse = {
      response: result.response || 'No response generated',
      sources: result.sources || [],
      codeReferences: result.codeReferences || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Query processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
