import { CodeReference } from './github';

export interface QueryRequest {
  repositoryUrl: string;
  query: string;
  userToken: string; // GitHub token is required for all operations
}

export interface QueryResponse {
  response: string;
  sources: string[];
  codeReferences?: CodeReference[];
}