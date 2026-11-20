import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Flag,
  StickyNote,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { RoadmapWeek } from "../types/roadmap";

interface RoadmapTimelineProps {
  targetRole: string;
  weeks: RoadmapWeek[];
  completedWeeks: number[];
  completedObjectives: Record<string, boolean>;
  weekNotes: Record<number, string>;
  onToggleWeekComplete: (weekNumber: number) => void;
  onToggleObjective: (weekNumber: number, objectiveIndex: number) => void;
  onUpdateWeekNote: (weekNumber: number, note: string) => void;
}

export function RoadmapTimeline({
  targetRole,
  weeks,
  completedWeeks,
  completedObjectives,
  weekNotes,
  onToggleWeekComplete,
  onToggleObjective,
  onUpdateWeekNote,
}: RoadmapTimelineProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1, 2]);
  const [openNoteWeek, setOpenNoteWeek] = useState<number | null>(null);
  const [copiedWeek, setCopiedWeek] = useState<number | null>(null);

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

  const handleCopyWeek = async (item: RoadmapWeek) => {
    const text = [
      `Week ${item.week}: ${item.title} (${item.hoursAllocated} hrs)`,
      `Focus: ${item.focusArea}`,
      "",
      "Objectives:",
      ...item.objectives.map((o, idx) => {
        const done = completedObjectives[`${item.week}-${idx}`] ? "x" : " ";
        return `- [${done}] ${o}`;
      }),
      "",
      `Topics: ${item.topics.join(", ")}`,
      `Milestone: ${item.milestone}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedWeek(item.week);
      window.setTimeout(() => setCopiedWeek(null), 1600);
    } catch {
      // Clipboard unavailable
    }
  };

  const completedCount = completedWeeks.length;
  const progressPercent =
    weeks.length > 0 ? Math.round((completedCount / weeks.length) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
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
            Check off weekly objectives, add study notes, or open docs for any topic ·{" "}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {completedCount}/{weeks.length}
            </span>{" "}
            weeks completed
          </p>
        </div>

        <div className="no-print flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div
              className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Roadmap completion progress"
            >
              <motion.div
                className="h-full bg-blue-700 dark:bg-blue-500 origin-left"
                animate={{ scaleX: progressPercent / 100 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
          const hasNote = Boolean(weekNotes[item.week]?.trim());
          const noteOpen = openNoteWeek === item.week;
          const doneObjectives = item.objectives.filter(
            (_, idx) => completedObjectives[`${item.week}-${idx}`]
          ).length;

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
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
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
                  </motion.button>

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
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {doneObjectives}/{item.objectives.length} objectives
                      </span>
                      {isCompleted && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Completed
                          </span>
                        </>
                      )}
                      {hasNote && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            Note saved
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

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="px-5 sm:px-6 pb-5 pt-1 pl-14 sm:pl-16 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                          Learning Objectives
                        </h4>
                        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          {item.objectives.map((objective, idx) => {
                            const objDone = Boolean(
                              completedObjectives[`${item.week}-${idx}`]
                            );
                            return (
                              <li key={idx}>
                                <button
                                  type="button"
                                  onClick={() => onToggleObjective(item.week, idx)}
                                  aria-pressed={objDone}
                                  className="w-full text-left flex items-start gap-2.5 group cursor-pointer"
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                      objDone
                                        ? "bg-blue-700 dark:bg-blue-600 border-blue-700 dark:border-blue-600 text-white"
                                        : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent group-hover:border-blue-600 dark:group-hover:border-blue-400"
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </span>
                                  <span
                                    className={`leading-relaxed transition-colors ${
                                      objDone
                                        ? "text-slate-400 dark:text-slate-500 line-through"
                                        : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                                    }`}
                                  >
                                    {objective}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                            Core Topics &amp; Study Guides
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                            {item.topics.map((topic, tIdx) => {
                              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                                `${topic} tutorial documentation ${targetRole}`
                              )}`;
                              return (
                                <a
                                  key={`${topic}-${tIdx}`}
                                  href={searchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 underline decoration-slate-300 dark:decoration-slate-700 hover:decoration-blue-600 underline-offset-4 transition-colors"
                                >
                                  <span>{topic}</span>
                                  <ExternalLink
                                    className="w-3 h-3 text-slate-400"
                                    aria-hidden="true"
                                  />
                                </a>
                              );
                            })}
                          </div>
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

                    {/* Week Actions: Copy Checklist & Study Note */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 no-print">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenNoteWeek(noteOpen ? null : item.week)
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                      >
                        <StickyNote className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {noteOpen
                            ? "Hide Note"
                            : hasNote
                            ? "Edit Study Note"
                            : "Add Study Note"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyWeek(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                      >
                        {copiedWeek === item.week ? (
                          <>
                            <Check
                              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span className="text-emerald-700 dark:text-emerald-400">
                              Copied Week
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy Week</span>
                          </>
                        )}
                      </button>
                    </div>

                    {noteOpen && (
                      <div className="pt-1 no-print">
                        <label
                          htmlFor={`week-note-${item.week}`}
                          className="sr-only"
                        >
                          Personal study notes for Week {item.week}
                        </label>
                        <textarea
                          id={`week-note-${item.week}`}
                          rows={2}
                          value={weekNotes[item.week] ?? ""}
                          onChange={(e) =>
                            onUpdateWeekNote(item.week, e.target.value)
                          }
                          placeholder="Jot down course links, key takeaways, or blocker questions for this week..."
                          className="w-full p-2.5 text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
