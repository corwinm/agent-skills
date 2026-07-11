import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AgentResponse, CommentInput, ReviewStorage } from "./types.ts";

const now = (): string => new Date().toISOString();
const id = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;
const parse = (value: unknown): unknown => (typeof value === "string" ? JSON.parse(value) : value);

export class SqliteReviewStorage implements ReviewStorage {
  readonly db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS threads (id TEXT PRIMARY KEY, target TEXT NOT NULL, body TEXT NOT NULL, author TEXT NOT NULL, selection TEXT NOT NULL, status TEXT NOT NULL, resolution TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS replies (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES threads(id), body TEXT NOT NULL, author TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES threads(id), status TEXT NOT NULL, response TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);`);
  }
  private thread(row: Record<string, unknown>): unknown {
    const replies = this.db
      .prepare("SELECT * FROM replies WHERE thread_id=? ORDER BY created_at,id")
      .all(String(row.id));
    return { ...row, target: parse(row.target), selection: parse(row.selection), replies };
  }
  createComment(input: CommentInput): unknown {
    if (!input.body?.trim() || !input.target?.record_id)
      throw new Error("body and target.record_id are required");
    const value = { id: id("comment"), created_at: now() };
    this.db
      .prepare("INSERT INTO threads VALUES (?,?,?,?,?,?,?,?,?)")
      .run(
        value.id,
        JSON.stringify(input.target),
        input.body.trim(),
        input.author ?? "reviewer",
        JSON.stringify(input.selection ?? {}),
        "open",
        null,
        value.created_at,
        value.created_at,
      );
    return this.getComment(value.id)!;
  }
  listComments(): unknown[] {
    return this.db
      .prepare("SELECT * FROM threads ORDER BY created_at,id")
      .all()
      .map((r) => this.thread(r));
  }
  getComment(idValue: string): unknown | undefined {
    const row = this.db.prepare("SELECT * FROM threads WHERE id=?").get(idValue);
    return row ? this.thread(row) : undefined;
  }
  addReply(threadId: string, body: string, author = "reviewer"): unknown {
    if (!body?.trim() || !this.getComment(threadId))
      throw new Error("thread and body are required");
    this.db
      .prepare("INSERT INTO replies VALUES (?,?,?,?,?)")
      .run(id("reply"), threadId, body.trim(), author, now());
    this.db.prepare("UPDATE threads SET updated_at=? WHERE id=?").run(now(), threadId);
    return this.getComment(threadId)!;
  }
  createJob(threadId: string): unknown {
    if (!this.getComment(threadId)) throw new Error("comment not found");
    const value = { id: id("job"), thread_id: threadId, status: "queued", created_at: now() };
    this.db
      .prepare("INSERT INTO jobs VALUES (?,?,?,?,?,?,?)")
      .run(value.id, threadId, value.status, null, null, value.created_at, value.created_at);
    return this.getJob(value.id)!;
  }
  updateJob(jobId: string, status: string, response?: AgentResponse, error?: string): void {
    this.db
      .prepare("UPDATE jobs SET status=?,response=?,error=?,updated_at=? WHERE id=?")
      .run(status, response ? JSON.stringify(response) : null, error ?? null, now(), jobId);
  }
  listJobs(): unknown[] {
    return this.db.prepare("SELECT * FROM jobs ORDER BY created_at,id").all().map(job);
  }
  getJob(jobId: string): unknown | undefined {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id=?").get(jobId);
    return row ? job(row) : undefined;
  }
  resolveComment(threadId: string, resolution: string): unknown {
    if (!this.getComment(threadId)) throw new Error("comment not found");
    this.db
      .prepare("UPDATE threads SET status='resolved',resolution=?,updated_at=? WHERE id=?")
      .run(resolution, now(), threadId);
    return this.getComment(threadId)!;
  }
  close(): void {
    this.db.close();
  }
}
function job(row: Record<string, unknown>): unknown {
  return { ...row, response: row.response ? parse(row.response) : null };
}
