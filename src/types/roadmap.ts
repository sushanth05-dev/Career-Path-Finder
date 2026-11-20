export type SkillStatus = "Have" | "Partial" | "To Learn";
export type SkillPriority = "Critical" | "High" | "Recommended";
export type ProjectDifficulty = "Starter" | "Intermediate" | "Capstone";
export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";
export type InterviewCategory = "Technical" | "Applied Scenario" | "Behavioral";
export type InterviewDifficulty = "Foundational" | "Core" | "Stretch";

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

export interface StudyResource {
  title: string;
  type: "Docs" | "Course" | "Practice" | "Article";
  url: string;
}

export interface RoadmapWeek {
  week: number;
  title: string;
  focusArea: string;
  hoursAllocated: number;
  objectives: string[];
  topics: string[];
  milestone: string;
  resources?: StudyResource[];
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

export interface InterviewQuestion {
  id: string;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  skillTested: string;
  question: string;
  whatInterviewersLookFor: string;
  answerFramework: string[];
  sampleOutline: string;
}

export interface InterviewPrepResponse {
  targetRole: string;
  focusSummary: string;
  questions: InterviewQuestion[];
}

export interface SavedRoadmapEntry {
  id: string;
  createdAt: string;
  skillsInput: string[];
  experienceLevel: ExperienceLevel;
  completedWeeks: number[];
  weekNotes: Record<number, string>;
  completedObjectives?: Record<string, boolean>;
  completedDeliverables?: Record<string, boolean>;
  skillStatusOverrides?: Record<string, SkillStatus>;
  interviewPrep?: InterviewPrepResponse | null;
  practicedQuestions?: string[];
  interviewDrafts?: Record<string, string>;
  data: CareerRoadmapResponse;
}
