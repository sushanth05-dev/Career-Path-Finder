import { Download, Sparkles } from "lucide-react";

export type ActiveView = "all" | "skills" | "roadmap" | "projects";

interface TopBarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  hasRoadmap: boolean;
  onExportMarkdown: () => void;
  onLoadSample: () => void;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: "all", label: "Overview" },
  { id: "skills", label: "Skill Matrix" },
  { id: "roadmap", label: "8-Week Plan" },
  { id: "projects", label: "Projects" },
];

export function TopBar({
  activeView,
  onSelectView,
  hasRoadmap,
  onExportMarkdown,
  onLoadSample,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectView("all");
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          CareerPath
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded ${
                  isActive
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-blue-600 dark:bg-blue-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          {hasRoadmap ? (
            <button
              type="button"
              onClick={onExportMarkdown}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export Plan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              <span>Try Sample</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
