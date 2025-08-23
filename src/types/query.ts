export interface QueryRequest {
  repositoryUrl: string;
  query: string;
}

export interface QueryResponse {
  response: string;
  sources: string[];
}