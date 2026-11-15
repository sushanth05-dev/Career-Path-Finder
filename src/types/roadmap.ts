export type SkillStatus = 'Have' | 'Partial' | 'To Learn';
export type SkillPriority = 'Critical' | 'High' | 'Recommended';
export type ProjectDifficulty = 'Starter' | 'Intermediate' | 'Capstone';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface RoadmapRequest {
  currentSkills: string[];
  targetRole: string;
  hoursPerWeek: number;
  experienceLevel: ExperienceLevel;
}

export interface SkillGapItem {
  skill: string;
  category: string;
  currentStatus: SkillStatus;
  currentLevel: string;
  targetRequirement: string;
  priority: SkillPriority;
  estimatedHours: number;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  focusArea: string;
  hoursAllocated: number;
  objectives: string[];
  topics: string[];
  milestone: string;
}

export interface MiniProject {
  title: string;
  difficulty: ProjectDifficulty;
  estimatedHours: number;
  recommendedWeek: string;
  summary: string;
  skillsApplied: string[];
  deliverables: string[];
}

export interface CareerRoadmapResponse {
  targetRole: string;
  hoursPerWeek: number;
  roleSummary: string;
  readinessSummary: string;
  skillGapTable: SkillGapItem[];
  roadmapWeeks: RoadmapWeek[];
  miniProjects: MiniProject[];
}
