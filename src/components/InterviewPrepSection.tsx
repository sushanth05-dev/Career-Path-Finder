import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type {
  InterviewCategory,
  InterviewPrepResponse,
} from "../types/roadmap";

interface InterviewPrepSectionProps {
  targetRole: string;
  interviewPrep: InterviewPrepResponse | null;
  practicedQuestions: string[];
  drafts: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onTogglePracticed: (questionId: string) => void;
  onUpdateDraft: (questionId: string, value: string) => void;
}

type CategoryFilter = "All" | InterviewCategory;
const CATEGORIES: CategoryFilter[] = [
  "All",
  "Technical",
  "Applied Scenario",
  "Behavioral",
];

export function InterviewPrepSection({
  targetRole,
  interviewPrep,
  practicedQuestions,
  drafts,
  isLoading,
  error,
  onGenerate,
  onTogglePracticed,
  onUpdateDraft,
}: InterviewPrepSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const questions = interviewPrep?.questions ?? [];

  const filteredQuestions = useMemo(() => {
    if (categoryFilter === "All") return questions;
    return questions.filter((q) => q.category === categoryFilter);
  }, [questions, categoryFilter]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const practicedCount = questions.filter((q) =>
    practicedQuestions.includes(q.id)
  ).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="interview-prep-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            id="interview-prep-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Role Interview Prep Drills
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {interviewPrep
              ? `Tailored practice prompts for ${interviewPrep.targetRole} · ${practicedCount}/${questions.length} practiced`
              : `Practice technical, scenario, and behavioral questions targeted at your ${targetRole} skill gaps`}
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="no-print inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Building Questions...</span>
            </>
          ) : interviewPrep ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Refresh Set</span>
            </>
          ) : (
            <>
              <MessageSquareText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Generate 6 Questions</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-5 sm:mx-6 mt-4 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {isLoading && !interviewPrep ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="h-14 w-full bg-slate-100 dark:bg-slate-800/70 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : !interviewPrep ? (
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Generate a focused set of 6 interview prompts covering your key
              missing skills, applied problem-solving scenarios, and portfolio
              storytelling. Draft your responses first, then compare them
              against the hiring rubric.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="px-5 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {interviewPrep.focusSummary}
            </p>

            <div
              role="group"
              aria-label="Filter interview questions by category"
              className="no-print inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto shrink-0"
            >
              {CATEGORIES.map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="interview-cat-indicator"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredQuestions.map((item, idx) => {
              const isExpanded =
                expandedId === item.id || (expandedId === null && idx === 0);
              const isPracticed = practicedQuestions.includes(item.id);
              const isRevealed = revealedIds.includes(item.id);

              return (
                <article
                  key={item.id}
                  className={`transition-colors ${
                    isPracticed
                      ? "bg-slate-50/70 dark:bg-slate-900/50"
                      : "bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="px-5 sm:px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onTogglePracticed(item.id)}
                        aria-pressed={isPracticed}
                        aria-label={`Mark question as ${
                          isPracticed ? "not practiced" : "practiced"
                        }`}
                        className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isPracticed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-600 dark:hover:border-blue-400"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </motion.button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? "__none__" : item.id)
                        }
                        aria-expanded={isExpanded}
                        className="text-left min-w-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-blue-700 dark:text-blue-400">
                            {item.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.difficulty}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.skillTested}</span>
                          {isPracticed && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                Practiced
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors leading-snug">
                          {item.question}
                        </h3>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? "__none__" : item.id)
                      }
                      aria-label={isExpanded ? "Collapse question" : "Expand question"}
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
                        <div className="no-print">
                          <label
                            htmlFor={`draft-${item.id}`}
                            className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5"
                          >
                            Your Practice Draft
                          </label>
                          <textarea
                            id={`draft-${item.id}`}
                            rows={3}
                            value={drafts[item.id] ?? ""}
                            onChange={(e) =>
                              onUpdateDraft(item.id, e.target.value)
                            }
                            placeholder="Write bullet points or your spoken answer here before revealing the hiring rubric..."
                            className="w-full p-3 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-3 no-print">
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-md transition-colors cursor-pointer"
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Hide Answer Guide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Reveal Answer Guide</span>
                              </>
                            )}
                          </button>
                        </div>

                        {isRevealed && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                  What Interviewers Look For
                                </h4>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {item.whatInterviewersLookFor}
                                </p>
                              </div>

                              <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                                  Answer Structure
                                </h4>
                                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                  {item.answerFramework.map((point, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-2">
                                      <span
                                        aria-hidden="true"
                                        className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-1"
                                      >
                                        {pIdx + 1}.
                                      </span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Strong Response Outline
                              </h4>
                              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                {item.sampleOutline}
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}
