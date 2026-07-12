export type Target = { record_id: string; record_type?: string; field?: string; page?: string };
export type CommentInput = {
  target: Target;
  body: string;
  author?: string;
  selection?: { exact?: string; prefix?: string; suffix?: string };
};
export type AgentRequest = {
  version: "1";
  workspace: { id: string; authority: string };
  thread: unknown;
  canonical: unknown;
};
export type AgentProposal = {
  summary: string;
  record_id?: string;
  field?: string;
  before?: unknown;
  after?: unknown;
  risk: "meaning-preserving" | "material";
  resolution?: string;
};
export type AgentResponse = { version: "1"; message: string; proposal?: AgentProposal };
export interface AgentAdapter {
  handle(request: AgentRequest): Promise<AgentResponse>;
}
export interface ReviewStorage {
  createComment(input: CommentInput): unknown;
  listComments(): unknown[];
  getComment(id: string): unknown | undefined;
  addReply(id: string, body: string, author?: string): unknown;
  createJob(commentId: string): unknown;
  updateJob(id: string, status: string, response?: AgentResponse, error?: string): void;
  listJobs(): unknown[];
  getJob(id: string): unknown | undefined;
  resolveComment(id: string, resolution: string): unknown;
  close(): void;
}
