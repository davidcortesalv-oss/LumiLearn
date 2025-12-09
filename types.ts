
import { Type } from "@google/genai";

// Enums
export enum Difficulty {
  BEGINNER = 'Principiante',
  INTERMEDIATE = 'Intermedio',
  ADVANCED = 'Avanzado',
  ADAPTIVE = 'Adaptativo (IA)',
}

export enum AppView {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  MAP_GENERATOR = 'map_generator',
  QUIZ = 'quiz',
  PLANNER = 'planner',
  STORY = 'story_mode',
  INFOGRAPHIC = 'infographic',
  MATERIALS = 'materials',
  ASSISTANT = 'assistant', // NEW
}

// --- BACKGROUND TASKS ---
export type BackgroundTaskStatus = 'idle' | 'loading' | 'success' | 'error';

export interface BackgroundState {
  mapGenerator: BackgroundTaskStatus;
  storyGenerator: BackgroundTaskStatus;
}

export enum QuizType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_IN_THE_BLANK = 'fill_in_the_blank',
  ORDERING = 'ordering',
  RELATION = 'relation'
}

export type BoostType = 'hint_ia' | 'double_xp' | 'second_chance';

export interface QuizBadge {
  id: string;
  icon: string;
  label: string;
  description: string;
  unlocked: boolean;
}

// --- USER & AUTH TYPES ---

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: 'student' | 'teacher';
  joinedAt: number;
}

// --- GAMIFICATION CORE ---

export enum RankTier {
  NOVICE = 'Novato',
  BRONZE = 'Bronce',
  SILVER = 'Plata',
  GOLD = 'Oro',
  PLATINUM = 'Platino',
  DIAMOND = 'Diamante',
  MASTER = 'Maestro',
  GRANDMASTER = 'Gran Maestro',
  ASCENDANT = 'Ascendente',
  LUMEN_MYTHIC = 'Lumen Mítico'
}

export interface Skill {
  id: 'memory' | 'logic' | 'creativity' | 'focus' | 'speed';
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  icon: string; // lucide icon name
  bonus: string; // Description of the bonus (e.g. "+5% XP")
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'arc';
  progress: number;
  target: number;
  completed: boolean;
  rewardXP: number;
  rewardGems: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number; // timestamp
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// --- REWARDS SYSTEM ---

export type RewardCategory = 'booster' | 'theme' | 'avatar';

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  cost: number;
  icon: string; // Lucide icon name
  unlocked: boolean;
  active?: boolean; // For themes/avatars
}

// Interfaces
export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  energy: number; // Max 100
  streak: number;
  gems: number; // Lumicoins
  rank: RankTier;
  skillPoints: number;
  skills: Skill[];
  activeQuests: Quest[];
  achievements: Achievement[];
  // Inventory
  rewards: Reward[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- NEW LIVING MAP TYPES ---

export type NodeType = 'Root' | 'Concept' | 'Definition' | 'Process' | 'Example' | 'Event';

export interface MapNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  mastery: number; 
  importance: number; 
  parentId?: string; 
  expanded?: boolean; 
  x?: number; 
  y?: number; 
  fx?: number | null; 
  fy?: number | null; 
}

export interface MapLink {
  source: string | MapNode; 
  target: string | MapNode;
  relation: string;
}

export interface LivingMapData {
  nodes: MapNode[];
  links: MapLink[];
}

export interface NodeQuiz {
  question: string;
  type: QuizType;
  options?: string[];
  correctAnswer: string;
  feedback: string;
}

export interface SavedMap {
  id: string;
  title: string;
  timestamp: number;
  data: LivingMapData;
  previewNodeCount: number;
}

// --- FILE STORAGE TYPES ---

export interface StoredFile {
  id: string;
  name: string;
  type: string; // mime type
  data: string; // base64
  subjectId: string;
  createdAt: number;
  size: number;
  extractedContent?: string; // NEW: Pre-processed text content for instant usage
}

// --- QUIZ ARENA TYPES ---

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[]; 
  items?: string[]; 
  pairs?: { left: string; right: string }[]; 
  correctAnswer: string | string[] | { left: string; right: string }[]; 
  explanation: string; // Base explanation
  
  // Rich Feedback fields (Optional)
  analogy?: string; 
  distractorAnalysis?: string;
  associatedNodeId?: string;
}

export interface QuizConfig {
  questionCount: number;
  difficulty: Difficulty;
  topic: string;
  mode: 'random' | 'node_focus';
}

export interface QuizAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  studySuggestions: string[];
  xpEarned: number;
  badgesEarned: QuizBadge[];
}

// --- PLANNER & CALENDAR TYPES ---

export type CalendarEventType = 'exam' | 'task' | 'review' | 'project' | 'study_session';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  completed: boolean;
  subjectId?: string;
  description?: string;
}

export interface StudyPlanConfig {
  subject: string;
  examTitle: string;
  examDate: string;
  difficulty: 'suave' | 'normal' | 'intenso';
  dailyMinutes: number;
}

// --- STORY MODE / MOVIE MODE TYPES ---

export interface VideoMetadata {
  title: string;
  topic: string;
  totalDurationSeconds: number;
  summary: string;
}

export interface VideoScene {
  title: string;
  narration: string;
  imagePrompt: string;
  screenText: string;
  imageUrl?: string; // Generated URL
}

export interface ProductionStep {
  step: string;
  status: 'pending' | 'processing' | 'completed';
  message: string;
}

export interface GeneratedVideo {
  metadata: VideoMetadata;
  scenes: VideoScene[]; // NEW: Structured scenes
  script: string; // Full joined script for audio
  videoUrl: string; // Veo generated video background
  audioUrl: string; // ElevenLabs generated audio
  subtitles: string; // SRT content
}

// --- INFOGRAPHIC TYPES ---

export interface InfographicHighlight {
  label: string;
  value: string;
  note?: string;
}

export interface InfographicQuiz {
  question: string;
  options: string[];
  correct_option: string;
  explanation: string;
}

export interface InfographicSection {
  id: string;
  type: 'definicion' | 'conceptos_clave' | 'pasos' | 'causas' | 'consecuencias' | 'comparacion' | 'ejemplo' | 'resumen' | 'mixto';
  heading: string;
  layout_hint?: string;
  icon_hint?: string;
  description?: string;
  bullets?: string[];
  highlight_items?: InfographicHighlight[];
  examples?: string[];
  mini_quiz?: InfographicQuiz;
}

export interface InfographicData {
  orientation: 'horizontal' | 'vertical' | 'cuadrada';
  topic: string;
  goal: string;
  language: string;
  target_level: string;
  title: string;
  subtitle: string;
  summary: string;
  sections: InfographicSection[];
  visual_suggestions?: {
    main_metaphor?: string;
    diagram_types?: string[];
    recommended_icons?: string[];
    color_palette_hint?: string[];
    background_hint?: string;
  };
  call_to_action?: string;
  footnotes?: string[];
}

// --- FLASHCARDS TYPES (Kept for compatibility with existing contexts but unused in view) ---

export type FlashcardMastery = 'new' | 'learning' | 'reviewing' | 'mastered' | 'legendary';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  visualHook?: string;
  memoryTip?: string; 
  difficulty: number; 
  
  mastery: FlashcardMastery;
  nextReview: number; 
  interval: number; 
  easeFactor: number; 
  repetitions: number;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  theme: 'candy' | 'neon' | 'ocean' | 'forest';
  cards: Flashcard[];
  createdAt: number;
  lastStudied?: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  title: string;
  startTime: string; 
  durationMinutes: number;
  type: 'review' | 'practice' | 'exam_prep';
}