import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Clock, Search } from "lucide-react";
import type { SkillGapItem, SkillStatus } from "../types/roadmap";

interface SkillGapTableProps {
  items: SkillGapItem[];
}

type StatusFilter = "All" | SkillStatus;

const FILTERS: StatusFilter[] = ["All", "Have", "Partial", "To Learn"];

function StatusIndicator({ status }: { status: SkillStatus }) {
  if (status === "Have") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Have</span>
      </span>
    );
  }
  if (status === "Partial") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Partial</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
      <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>To Learn</span>
    </span>
  );
}

export function SkillGapTable({ items }: SkillGapTableProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const have = items.filter((i) => i.currentStatus === "Have").length;
    const partial = items.filter((i) => i.currentStatus === "Partial").length;
    const toLearn = items.filter((i) => i.currentStatus === "To Learn").length;
    return { All: items.length, Have: have, Partial: partial, "To Learn": toLearn };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "All" || item.currentStatus === statusFilter;
      const matchesQuery =
        !q ||
        item.skill.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.targetRequirement.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [items, statusFilter, query]);

  return (
    <section
      aria-labelledby="skill-gap-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2
            id="skill-gap-heading"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Skills Already Have vs. Skills to Learn
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Competency comparison against entry-level target role requirements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              className="w-full sm:w-48 h-9 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-blue-600 dark:focus:border-blue-500"
            />
          </div>

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
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {filter} ({counts[filter]})
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
                {filtered.map((row) => (
                  <tr
                    key={`${row.skill}-${row.category}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4 align-top">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{row.skill}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <StatusIndicator status={row.currentStatus} />
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
                      {row.estimatedHours === 0 ? "0 hrs" : `${row.estimatedHours} hrs`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked List View */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((row) => (
              <div
                key={`${row.skill}-${row.category}-mobile`}
                className="p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {row.skill}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {row.category} · {row.priority} priority
                    </div>
                  </div>
                  <StatusIndicator status={row.currentStatus} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="block text-slate-400 dark:text-slate-500">Current</span>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                      {row.currentLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-400 dark:text-slate-500">Est. Study</span>
                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-medium">
                      {row.estimatedHours} hrs
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
    </section>
  );
}
