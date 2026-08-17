export interface RequestRecord {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  query: string;
  proto: string;
  request_headers: Record<string, string[]>;
  request_body: string;
  response_headers: Record<string, string[]>;
  response_body: string;
  status_code: number;
  status_text: string;
  latency_ms: number;
  content_length: number;
}

export type MethodFilter = 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type StatusFilter = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx';
