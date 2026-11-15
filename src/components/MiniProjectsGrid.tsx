import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { MiniProject } from "../types/roadmap";

interface MiniProjectsGridProps {
  projects: MiniProject[];
}

export function MiniProjectsGrid({ projects }: MiniProjectsGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (project: MiniProject, index: number) => {
    const text = [
      `# ${project.title}`,
      `${project.difficulty} · ${project.estimatedHours} hrs · ${project.recommendedWeek}`,
      "",
      project.summary,
      "",
      `Skills Applied: ${project.skillsApplied.join(", ")}`,
      "",
      "Deliverables:",
      ...project.deliverables.map((d) => `- [ ] ${d}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <section aria-labelledby="projects-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2
            id="projects-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            3 Portfolio Mini-Project Ideas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Hands-on builds sequenced across your 8-week plan to prove job readiness
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {projects.map((project, index) => {
          const isCopied = copiedIndex === index;
          return (
            <article
              key={`${project.title}-${index}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-semibold ${
                        project.difficulty === "Capstone"
                          ? "text-blue-700 dark:text-blue-400"
                          : project.difficulty === "Intermediate"
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {project.difficulty}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {project.estimatedHours} hrs
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{project.recommendedWeek}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(project, index)}
                    aria-label={`Copy brief for ${project.title}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mt-2.5 leading-snug">
                  {project.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {project.summary}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Skills Applied
                  </h4>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                    {project.skillsApplied.join(" · ")}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Portfolio Deliverables
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {project.deliverables.map((deliverable, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="font-mono text-slate-400 dark:text-slate-500 mt-0.5"
                      >
                        {dIdx + 1}.
                      </span>
                      <span className="leading-relaxed">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
