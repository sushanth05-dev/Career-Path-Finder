import { useMemo, useState } from "react";
import { ArrowUpDown, BookOpen, CheckCircle2, Clock, Search } from "lucide-react";
import { motion } from "motion/react";
import type { SkillGapItem, SkillStatus } from "../types/roadmap";
import { getSkillKey } from "../utils/exportPlan";

interface SkillGapTableProps {
  items: SkillGapItem[];
  statusOverrides: Record<string, SkillStatus>;
  onCycleSkillStatus: (skillKey: string, currentStatus: SkillStatus) => void;
}

type StatusFilter = "All" | SkillStatus;
type SortKey = "default" | "hoursDesc" | "priority";

const FILTERS: StatusFilter[] = ["All", "Have", "Partial", "To Learn"];

const PRIORITY_RANK: Record<string, number> = {
  Critical: 0,
  High: 1,
  Recommended: 2,
};

function StatusButton({
  status,
  skillName,
  onClick,
}: {
  status: SkillStatus;
  skillName: string;
  onClick: () => void;
}) {
  const nextLabel =
    status === "To Learn"
      ? "Partial"
      : status === "Partial"
      ? "Have"
      : "To Learn";

  if (status === "Have") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Click to mark ${skillName} as ${nextLabel}`}
        aria-label={`${skillName} status: Have. Click to change to ${nextLabel}`}
        className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors whitespace-nowrap cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Have</span>
      </button>
    );
  }
  if (status === "Partial") {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Click to mark ${skillName} as ${nextLabel}`}
        aria-label={`${skillName} status: Partial. Click to change to ${nextLabel}`}
        className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors whitespace-nowrap cursor-pointer"
      >
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Partial</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Click to mark ${skillName} as ${nextLabel}`}
      aria-label={`${skillName} status: To Learn. Click to change to ${nextLabel}`}
      className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded-md text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors whitespace-nowrap cursor-pointer"
    >
      <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>To Learn</span>
    </button>
  );
}

export function SkillGapTable({
  items,
  statusOverrides,
  onCycleSkillStatus,
}: SkillGapTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [query, setQuery] = useState("");

  const resolvedItems = useMemo(
    () =>
      items.map((item) => {
        const key = getSkillKey(item.skill, item.category);
        return {
          ...item,
          key,
          effectiveStatus: statusOverrides[key] ?? item.currentStatus,
        };
      }),
    [items, statusOverrides]
  );

  const counts = useMemo(() => {
    const have = resolvedItems.filter((i) => i.effectiveStatus === "Have").length;
    const partial = resolvedItems.filter((i) => i.effectiveStatus === "Partial").length;
    const toLearn = resolvedItems.filter((i) => i.effectiveStatus === "To Learn").length;
    return {
      All: resolvedItems.length,
      Have: have,
      Partial: partial,
      "To Learn": toLearn,
    };
  }, [resolvedItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = resolvedItems.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.effectiveStatus === statusFilter;
      const matchesQuery =
        !q ||
        item.skill.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.targetRequirement.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });

    if (sortBy === "hoursDesc") {
      return [...list].sort((a, b) => b.estimatedHours - a.estimatedHours);
    }
    if (sortBy === "priority") {
      return [...list].sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
      );
    }
    return list;
  }, [resolvedItems, statusFilter, query, sortBy]);

  const cycleSort = () => {
    setSortBy((prev) =>
      prev === "default" ? "priority" : prev === "priority" ? "hoursDesc" : "default"
    );
  };

  const sortLabel =
    sortBy === "priority"
      ? "Sorted: Priority"
      : sortBy === "hoursDesc"
      ? "Sorted: Study Hrs"
      : "Sort";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="skill-gap-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2
            id="skill-gap-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Skills Already Have vs. Skills to Learn
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Click any skill status to update your progress as you learn
          </p>
        </div>

        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter skills..."
              aria-label="Filter skills"
              className="w-full sm:w-44 h-9 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-blue-600 dark:focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={cycleSort}
            className="h-9 px-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>{sortLabel}</span>
          </button>

          <div
            role="group"
            aria-label="Filter by skill status"
            className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto"
          >
            {FILTERS.map((filter) => {
              const active = statusFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "text-slate-900 dark:text-slate-100"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="skill-filter-indicator"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs"
                    />
                  )}
                  <span className="relative z-10">
                    {filter} ({counts[filter]})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No skills match your current filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("All");
              setQuery("");
            }}
            className="mt-3 px-3.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pl-6 pr-4">Skill &amp; Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Your Current Level</th>
                  <th className="py-3 px-4">Target Requirement</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 pl-4 pr-6 text-right">Est. Study</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((row, idx) => (
                  <tr
                    key={`${row.key}-${idx}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {row.skill}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <StatusButton
                        status={row.effectiveStatus}
                        skillName={row.skill}
                        onClick={() =>
                          onCycleSkillStatus(row.key, row.effectiveStatus)
                        }
                      />
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-600 dark:text-slate-300">
                      {row.currentLevel}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-700 dark:text-slate-300 max-w-xs">
                      {row.targetRequirement}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <span
                        className={`text-xs font-medium ${
                          row.priority === "Critical"
                            ? "text-red-700 dark:text-red-400"
                            : row.priority === "High"
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-6 align-top text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.effectiveStatus === "Have"
                        ? "0 hrs"
                        : `${row.estimatedHours} hrs`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked List View */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((row, idx) => (
              <div key={`${row.key}-mobile-${idx}`} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {row.skill}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {row.category} · {row.priority} priority
                    </div>
                  </div>
                  <StatusButton
                    status={row.effectiveStatus}
                    skillName={row.skill}
                    onClick={() =>
                      onCycleSkillStatus(row.key, row.effectiveStatus)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="block text-slate-400 dark:text-slate-500">
                      Current
                    </span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {row.currentLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-400 dark:text-slate-500">
                      Est. Study
                    </span>
                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                      {row.effectiveStatus === "Have"
                        ? "0 hrs"
                        : `${row.estimatedHours} hrs`}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500">Target: </span>
                  {row.targetRequirement}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
