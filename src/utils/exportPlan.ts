import type { CareerRoadmapResponse } from "../types/roadmap";

export function formatRoadmapAsMarkdown(data: CareerRoadmapResponse): string {
  const lines: string[] = [];

  lines.push(`# Career Roadmap: ${data.targetRole}`);
  lines.push(`**Weekly Commitment:** ${data.hoursPerWeek} hours/week (8-Week Plan)`);
  lines.push("");
  lines.push(data.roleSummary);
  lines.push("");
  lines.push(`> ${data.readinessSummary}`);
  lines.push("");

  lines.push("## 1. Skill Gap Analysis (Have vs. To Learn)");
  lines.push("");
  lines.push("| Skill | Category | Status | Current Level | Target Requirement | Priority | Est. Hours |");
  lines.push("| --- | --- | --- | --- | --- | --- | ---: |");
  for (const row of data.skillGapTable) {
    lines.push(
      `| ${row.skill} | ${row.category} | ${row.currentStatus} | ${row.currentLevel} | ${row.targetRequirement} | ${row.priority} | ${row.estimatedHours}h |`
    );
  }
  lines.push("");

  lines.push("## 2. 8-Week Learning Roadmap");
  lines.push("");
  for (const week of data.roadmapWeeks) {
    lines.push(`### Week ${week.week}: ${week.title} (${week.hoursAllocated} hrs)`);
    lines.push(`**Focus Area:** ${week.focusArea}`);
    lines.push("");
    lines.push("**Objectives:**");
    for (const obj of week.objectives) {
      lines.push(`- ${obj}`);
    }
    lines.push("");
    lines.push(`**Key Topics:** ${week.topics.join(", ")}`);
    lines.push("");
    lines.push(`**End-of-Week Milestone:** ${week.milestone}`);
    lines.push("");
  }

  lines.push("## 3. Portfolio Mini-Project Ideas");
  lines.push("");
  data.miniProjects.forEach((proj, index) => {
    lines.push(`### ${index + 1}. ${proj.title}`);
    lines.push(
      `_${proj.difficulty} · ${proj.estimatedHours} hours · Recommended: ${proj.recommendedWeek}_`
    );
    lines.push("");
    lines.push(proj.summary);
    lines.push("");
    lines.push(`**Skills Applied:** ${proj.skillsApplied.join(", ")}`);
    lines.push("");
    lines.push("**Deliverables:**");
    for (const item of proj.deliverables) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType = "text/markdown") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
