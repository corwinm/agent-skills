#!/usr/bin/env node
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const request = JSON.parse(input);
    const thread = request.thread;
    const target = thread.target ?? {};
    const proposal = target.field
      ? {
          summary: `Address ${target.record_id ?? "record"}.${target.field}`,
          record_id: target.record_id,
          field: target.field,
          before: request.canonical?.value,
          after: `[mock revision] ${request.canonical?.value ?? ""}`.trim(),
          risk: "material",
          resolution: "revised",
        }
      : undefined;
    process.stdout.write(
      JSON.stringify({
        version: "1",
        message: proposal
          ? "Deterministic mock reviewed the thread."
          : "Deterministic mock reviewed the page comment; no field change was proposed.",
        ...(proposal ? { proposal } : {}),
      }),
    );
  } catch (error) {
    process.stderr.write(String(error));
    process.exitCode = 1;
  }
});
