const http = require("http");

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== EMPIRICAL API LAUNCH AUDIT TESTS ===");
  const testCases = [
    { name: "Next.js Site", websiteUrl: "https://nextjs.org", githubRepoUrl: "https://github.com/vercel/next.js" },
    { name: "Vercel Site", websiteUrl: "https://vercel.com", githubRepoUrl: "https://github.com/vercel/vercel" },
    { name: "React Site", websiteUrl: "https://react.dev", githubRepoUrl: "https://github.com/facebook/react" },
  ];

  for (const tc of testCases) {
    const p = await post("/api/projects", tc);
    console.log(`[Project Created]: ${tc.name} | Status: ${p.status} | ProjectId: ${p.data?.project?.id}`);
    if (p.data?.project?.id) {
      const projectId = p.data.project.id;
      const t0 = Date.now();
      const val = await post("/api/validate", { projectId, userId: "demo-user-123" });
      const elapsed = Date.now() - t0;
      console.log(`  └─ Audit Execution Status: ${val.status} | Run ID: ${val.data?.runId} | Time: ${elapsed}ms`);
    }
  }
}

main();
