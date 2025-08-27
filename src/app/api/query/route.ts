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

    // Check if client wants streaming
    const isStreaming = request.headers.get('accept') === 'text/stream';

    if (isStreaming) {
      // Create a streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Process the query and get streaming response
            const result = await processQuery({
              repository: repoInfo,
              query,
              githubToken,
              llmConfig,
              streaming: true,
              onToken: (token: string) => {
                const chunk = encoder.encode(
                  `data: ${JSON.stringify({ token })}\n\n`
                );
                controller.enqueue(chunk);
              },
            });

            if (!result.success) {
              const errorChunk = encoder.encode(
                `data: ${JSON.stringify({ error: result.error })}\n\n`
              );
              controller.enqueue(errorChunk);
            } else {
              // Send final metadata
              const finalData = {
                done: true,
                sources: result.sources || [],
                codeReferences: result.codeReferences || [],
              };
              const finalChunk = encoder.encode(
                `data: ${JSON.stringify(finalData)}\n\n`
              );
              controller.enqueue(finalChunk);
            }
          } catch {
            const errorChunk = encoder.encode(
              `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`
            );
            controller.enqueue(errorChunk);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Fallback to regular non-streaming response
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
