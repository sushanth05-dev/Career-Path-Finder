import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { CareerRoadmapResponse, SkillStatus } from "../types/roadmap";
import { getSkillKey } from "../utils/exportPlan";

interface RoadmapOverviewProps {
  roadmap: CareerRoadmapResponse;
  completedWeeksCount: number;
  statusOverrides: Record<string, SkillStatus>;
  completedObjectivesCount: number;
  totalObjectivesCount: number;
  onOpenInterviewPrep: () => void;
}

export function RoadmapOverview({
  roadmap,
  completedWeeksCount,
  statusOverrides,
  completedObjectivesCount,
  totalObjectivesCount,
  onOpenInterviewPrep,
}: RoadmapOverviewProps) {
  const stats = useMemo(() => {
    const resolved = roadmap.skillGapTable.map((item) => {
      const effectiveStatus =
        statusOverrides[getSkillKey(item.skill, item.category)] ??
        item.currentStatus;
      return {
        ...item,
        effectiveStatus,
        remainingHours: effectiveStatus === "Have" ? 0 : item.estimatedHours || 0,
      };
    });

    const total = resolved.length;
    const have = resolved.filter((s) => s.effectiveStatus === "Have").length;
    const partial = resolved.filter((s) => s.effectiveStatus === "Partial").length;
    const toLearn = resolved.filter((s) => s.effectiveStatus === "To Learn").length;

    const categoryHours = new Map<string, number>();
    let totalRemainingBridgeHours = 0;
    for (const item of resolved) {
      totalRemainingBridgeHours += item.remainingHours;
      if (item.remainingHours > 0) {
        categoryHours.set(
          item.category,
          (categoryHours.get(item.category) ?? 0) + item.remainingHours
        );
      }
    }

    const topCategories = Array.from(categoryHours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      have,
      partial,
      toLearn,
      havePct: total ? (have / total) * 100 : 0,
      partialPct: total ? (partial / total) * 100 : 0,
      toLearnPct: total ? (toLearn / total) * 100 : 0,
      totalRemainingBridgeHours,
      topCategories,
    };
  }, [roadmap, statusOverrides]);

  const totalSprintHours = roadmap.hoursPerWeek * roadmap.roadmapWeeks.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="overview-role-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 transition-colors"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="max-w-3xl">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Target Career Plan · 8-Week Sprint
          </div>
          <h1
            id="overview-role-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1 text-balance"
          >
            {roadmap.targetRole}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {roadmap.roleSummary}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            {roadmap.readinessSummary}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenInterviewPrep}
          className="no-print self-start inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Practice Interview Drills</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Skills Mastered
          </div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {stats.have}/{stats.total}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Objectives Done
          </div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {completedObjectivesCount}/{totalObjectivesCount}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            8-Week Study Total
          </div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {totalSprintHours} hrs
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Weeks Completed
          </div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-blue-700 dark:text-blue-400 mt-1">
            {completedWeeksCount}/{roadmap.roadmapWeeks.length}
          </div>
        </div>
      </div>

      {/* Skill Readiness Composition Bar & Category Hours */}
      {stats.total > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Role Competency Coverage
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {stats.have} Have · {stats.partial} Partial · {stats.toLearn} To Learn
              </span>
            </div>
            <div
              className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800"
              role="img"
              aria-label={`${stats.have} skills mastered, ${stats.partial} partial, ${stats.toLearn} to learn`}
            >
              {stats.havePct > 0 && (
                <motion.div
                  animate={{ width: `${stats.havePct}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-emerald-600 dark:bg-emerald-500"
                />
              )}
              {stats.partialPct > 0 && (
                <motion.div
                  animate={{ width: `${stats.partialPct}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-amber-500 dark:bg-amber-400"
                />
              )}
              {stats.toLearnPct > 0 && (
                <motion.div
                  animate={{ width: `${stats.toLearnPct}%` }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-blue-700 dark:bg-blue-500"
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Remaining Gap Focus
              </span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {stats.totalRemainingBridgeHours} hrs remaining
              </span>
            </div>
            {stats.topCategories.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {stats.topCategories.map(([category, hrs]) => (
                  <div key={category} className="inline-flex items-baseline gap-1.5">
                    <span>{category}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {hrs}h
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                All listed role skills marked as mastered.
              </p>
            )}
          </div>
        </div>
      )}
    </motion.section>
  );
}
