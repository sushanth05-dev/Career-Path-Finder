import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Flag } from "lucide-react";
import type { RoadmapWeek } from "../types/roadmap";

interface RoadmapTimelineProps {
  weeks: RoadmapWeek[];
  completedWeeks: number[];
  onToggleWeekComplete: (weekNumber: number) => void;
}

export function RoadmapTimeline({
  weeks,
  completedWeeks,
  onToggleWeekComplete,
}: RoadmapTimelineProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2]);

  const toggleExpand = (weekNum: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(weekNum)
        ? prev.filter((w) => w !== weekNum)
        : [...prev, weekNum]
    );
  };

  const allExpanded = expandedWeeks.length === weeks.length;

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedWeeks([]);
    } else {
      setExpandedWeeks(weeks.map((w) => w.week));
    }
  };

  const completedCount = completedWeeks.length;
  const progressPercent =
    weeks.length > 0 ? Math.round((completedCount / weeks.length) * 100) : 0;

  return (
    <section
      aria-labelledby="roadmap-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            id="roadmap-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            8-Week Learning Roadmap
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sequenced weekly study plan with checkpoints ·{" "}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {completedCount}/{weeks.length}
            </span>{" "}
            weeks completed
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div
              className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Roadmap completion progress"
            >
              <div
                className="h-full bg-blue-700 dark:bg-blue-500 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
              {progressPercent}%
            </span>
          </div>

          <button
            type="button"
            onClick={toggleAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {weeks.map((item) => {
          const isCompleted = completedWeeks.includes(item.week);
          const isExpanded = expandedWeeks.includes(item.week);

          return (
            <article
              key={item.week}
              className={`transition-colors ${
                isCompleted
                  ? "bg-slate-50/70 dark:bg-slate-900/50"
                  : "bg-white dark:bg-slate-900"
              }`}
            >
              <div className="px-5 sm:px-6 py-4 flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleWeekComplete(item.week)}
                    aria-pressed={isCompleted}
                    aria-label={`Mark Week ${item.week} as ${
                      isCompleted ? "incomplete" : "complete"
                    }`}
                    className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-600 dark:hover:border-blue-400"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(item.week)}
                    aria-expanded={isExpanded}
                    className="text-left min-w-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                        Week {String(item.week).padStart(2, "0")}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.focusArea}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {item.hoursAllocated} hrs
                      </span>
                      {isCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Completed
                          </span>
                        </>
                      )}
                    </div>
                    <h3
                      className={`font-display text-base font-semibold mt-0.5 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors ${
                        isCompleted
                          ? "text-slate-600 dark:text-slate-400 line-through decoration-slate-400 dark:decoration-slate-500"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {item.title}
                    </h3>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpand(item.week)}
                  aria-label={
                    isExpanded
                      ? `Collapse Week ${item.week}`
                      : `Expand Week ${item.week}`
                  }
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 sm:px-6 pb-5 pt-1 pl-14 sm:pl-16 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        Learning Objectives
                      </h4>
                      <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                        {item.objectives.map((objective, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span
                              aria-hidden="true"
                              className="text-slate-400 dark:text-slate-500 font-mono text-xs mt-1"
                            >
                              {idx + 1}.
                            </span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                          Core Topics &amp; Tools
                        </h4>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          {item.topics.join(" · ")}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          <Flag
                            className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400"
                            aria-hidden="true"
                          />
                          <span>End-of-Week Milestone</span>
                        </h4>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.milestone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
