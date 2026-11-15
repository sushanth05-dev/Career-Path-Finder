import type { CareerRoadmapResponse } from "../types/roadmap";

interface RoadmapOverviewProps {
  roadmap: CareerRoadmapResponse;
  completedWeeksCount: number;
}

export function RoadmapOverview({
  roadmap,
  completedWeeksCount,
}: RoadmapOverviewProps) {
  const haveCount = roadmap.skillGapTable.filter(
    (s) => s.currentStatus === "Have"
  ).length;
  const gapCount = roadmap.skillGapTable.filter(
    (s) => s.currentStatus !== "Have"
  ).length;
  const totalSprintHours = roadmap.hoursPerWeek * roadmap.roadmapWeeks.length;

  return (
    <section
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Skills Already Have</div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {haveCount}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Skills to Bridge</div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {gapCount}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">8-Week Study Total</div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {totalSprintHours} hrs
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Weeks Completed</div>
          <div className="font-mono text-xl sm:text-2xl font-semibold tabular-nums text-blue-700 dark:text-blue-400 mt-1">
            {completedWeeksCount}/{roadmap.roadmapWeeks.length}
          </div>
        </div>
      </div>
    </section>
  );
}
