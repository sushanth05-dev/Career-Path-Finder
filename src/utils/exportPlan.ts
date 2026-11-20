import type {
  CareerRoadmapResponse,
  InterviewPrepResponse,
  SkillStatus,
} from "../types/roadmap";

export interface ExportExtras {
  completedWeeks?: number[];
  weekNotes?: Record<number, string>;
  completedObjectives?: Record<string, boolean>;
  completedDeliverables?: Record<string, boolean>;
  skillStatusOverrides?: Record<string, SkillStatus>;
  interviewPrep?: InterviewPrepResponse | null;
}

export function getSkillKey(skill: string, category: string) {
  return `${skill}::${category}`;
}

export function formatRoadmapAsMarkdown(
  data: CareerRoadmapResponse,
  extras?: ExportExtras
): string {
  const lines: string[] = [];
  const completedWeeks = extras?.completedWeeks ?? [];
  const weekNotes = extras?.weekNotes ?? {};
  const completedObjectives = extras?.completedObjectives ?? {};
  const completedDeliverables = extras?.completedDeliverables ?? {};
  const overrides = extras?.skillStatusOverrides ?? {};

  lines.push(`# Career Roadmap: ${data.targetRole}`);
  lines.push(
    `**Weekly Commitment:** ${data.hoursPerWeek} hours/week (8-Week Plan · ${completedWeeks.length}/${data.roadmapWeeks.length} weeks completed)`
  );
  lines.push("");
  lines.push(data.roleSummary);
  lines.push("");
  lines.push(`> ${data.readinessSummary}`);
  lines.push("");

  lines.push("## 1. Skill Gap Analysis (Have vs. To Learn)");
  lines.push("");
  lines.push(
    "| Skill | Category | Status | Current Level | Target Requirement | Priority | Est. Hours |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- | ---: |");
  for (const row of data.skillGapTable) {
    const status = overrides[getSkillKey(row.skill, row.category)] ?? row.currentStatus;
    lines.push(
      `| ${row.skill} | ${row.category} | ${status} | ${row.currentLevel} | ${row.targetRequirement} | ${row.priority} | ${row.estimatedHours}h |`
    );
  }
  lines.push("");

  lines.push("## 2. 8-Week Learning Roadmap");
  lines.push("");
  for (const week of data.roadmapWeeks) {
    const doneMark = completedWeeks.includes(week.week) ? " [Completed]" : "";
    lines.push(
      `### Week ${week.week}: ${week.title} (${week.hoursAllocated} hrs)${doneMark}`
    );
    lines.push(`**Focus Area:** ${week.focusArea}`);
    lines.push("");
    lines.push("**Objectives:**");
    week.objectives.forEach((obj, objIdx) => {
      const checked = completedObjectives[`${week.week}-${objIdx}`] ? "x" : " ";
      lines.push(`- [${checked}] ${obj}`);
    });
    lines.push("");
    lines.push(`**Key Topics:** ${week.topics.join(", ")}`);
    lines.push("");
    lines.push(`**End-of-Week Milestone:** ${week.milestone}`);
    const note = weekNotes[week.week]?.trim();
    if (note) {
      lines.push("");
      lines.push(`**Study Notes:** ${note}`);
    }
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
    proj.deliverables.forEach((item, dIdx) => {
      const checked = completedDeliverables[`${index}-${dIdx}`] ? "x" : " ";
      lines.push(`- [${checked}] ${item}`);
    });
    lines.push("");
  });

  if (extras?.interviewPrep && extras.interviewPrep.questions.length > 0) {
    lines.push("## 4. Interview Prep Questions");
    lines.push("");
    lines.push(extras.interviewPrep.focusSummary);
    lines.push("");
    extras.interviewPrep.questions.forEach((q, idx) => {
      lines.push(`### Q${idx + 1} (${q.category} · ${q.difficulty}): ${q.question}`);
      lines.push(`**Skill Tested:** ${q.skillTested}`);
      lines.push(`**What Interviewers Look For:** ${q.whatInterviewersLookFor}`);
      lines.push("");
      lines.push("**Answer Structure:**");
      q.answerFramework.forEach((step) => lines.push(`- ${step}`));
      lines.push("");
      lines.push(`**Sample Outline:** ${q.sampleOutline}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/markdown"
) {
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
