import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import type { MiniProject } from "../types/roadmap";

interface MiniProjectsGridProps {
  projects: MiniProject[];
  completedDeliverables: Record<string, boolean>;
  onToggleDeliverable: (projectIndex: number, deliverableIndex: number) => void;
}

export function MiniProjectsGrid({
  projects,
  completedDeliverables,
  onToggleDeliverable,
}: MiniProjectsGridProps) {
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
      ...project.deliverables.map((d, dIdx) => {
        const done = completedDeliverables[`${index}-${dIdx}`] ? "x" : " ";
        return `- [${done}] ${d}`;
      }),
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
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="projects-heading"
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2
            id="projects-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            3 Portfolio Mini-Project Ideas
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track deliverables as you build each portfolio piece across your 8-week plan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {projects.map((project, index) => {
          const isCopied = copiedIndex === index;
          const doneCount = project.deliverables.filter(
            (_, dIdx) => completedDeliverables[`${index}-${dIdx}`]
          ).length;

          return (
            <motion.article
              key={`${project.title}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{
                duration: 0.2,
                delay: 0.05 * index,
                ease: [0.16, 1, 0.3, 1],
              }}
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
                    className="no-print inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors shrink-0 cursor-pointer"
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
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Portfolio Deliverables
                  </h4>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {doneCount}/{project.deliverables.length} done
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {project.deliverables.map((deliverable, dIdx) => {
                    const checked = Boolean(
                      completedDeliverables[`${index}-${dIdx}`]
                    );
                    return (
                      <li key={dIdx}>
                        <button
                          type="button"
                          onClick={() => onToggleDeliverable(index, dIdx)}
                          aria-pressed={checked}
                          className="w-full text-left flex items-start gap-2 group cursor-pointer"
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              checked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent group-hover:border-blue-600 dark:group-hover:border-blue-400"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </span>
                          <span
                            className={`leading-relaxed transition-colors ${
                              checked
                                ? "text-slate-400 dark:text-slate-500 line-through"
                                : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                            }`}
                          >
                            {deliverable}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
