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
  console.log("=== EMPIRICAL TEST: DYNAMIC HYBRID BLUEPRINT QUALITY SCORES ===");
  const testProjects = [
    { name: "QuickBite", idea: "Food delivery app connecting cloud kitchens with office workers", problem: "Office workers waste 45m finding healthy lunch", industry: "Food Delivery" },
    { name: "PharmaMatch", idea: "AI drug discovery target identification platform for oncology", problem: "Pharma R&D takes 10 years to find small molecule targets", industry: "AI Drug Discovery" },
    { name: "FitPulse", idea: "Local gym management system for class booking and locker rentals", problem: "Gyms struggle with manual paper check-ins", industry: "Local Gym Management" },
    { name: "PayShield", idea: "Cross-border payment settlement network for LATAM exporters", problem: "High 4% FX wire fees and 3-day delays", industry: "FinTech" },
    { name: "SkillTrack", idea: "Adaptive AI quiz generator for coding bootcamp students", problem: "Bootcamp students drop out due to lack of 1-on-1 feedback", industry: "EdTech" },
  ];

  const results = [];

  for (const p of testProjects) {
    const res = await post("/api/blueprint/generate", p);
    if (res.data?.blueprint?.qualityScore) {
      const q = res.data.blueprint.qualityScore;
      results.push({
        name: p.name,
        industry: p.industry,
        overallScore: q.overall,
        innovation: q.metrics.innovation,
        feasibility: q.metrics.technicalFeasibility,
        scalability: q.metrics.scalability,
        business: q.metrics.businessPotential,
        aiValue: q.metrics.aiNecessity,
      });
      console.log(`[${p.name} - ${p.industry}]: Overall Score = ${q.overall}/100 | Innovation = ${q.metrics.innovation}% | Feasibility = ${q.metrics.technicalFeasibility}% | Scalability = ${q.metrics.scalability}%`);
    } else {
      console.log(`[${p.name}]: Failed API response status ${res.status}`);
    }
  }

  console.log("\n==========================================================================");
  console.table(results);
}

main();
