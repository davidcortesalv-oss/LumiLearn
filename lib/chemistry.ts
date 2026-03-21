import {
  COMPOUNDS,
  COMPOUND_TYPE_LABELS,
  CompoundEntry,
  CompoundType,
  DEFAULT_SETTINGS,
  Difficulty,
  Nomenclature,
  PracticeDirection,
} from '../data/chemistry';

export interface Settings {
  activeTypes: CompoundType[];
  activeNomenclatures: Nomenclature[];
  difficulty: Difficulty;
  examMinutes: number;
  autoCorrection: boolean;
  autoExplanation: boolean;
  acceptAccentsOptional: boolean;
  timerEnabled: boolean;
}

export interface Exercise {
  id: string;
  compoundId: string;
  direction: PracticeDirection;
  nomenclature: Nomenclature;
  type: CompoundType;
  difficulty: Difficulty;
  prompt: string;
  expected: string[];
  formula: string;
  explanation: string;
  displayName: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  expected: string[];
  explanation: string;
  normalizedUserAnswer: string;
}

const difficultyRank: Record<Difficulty, number> = { facil: 1, media: 2, dificil: 3 };

export const createDefaultSettings = (): Settings => ({ ...DEFAULT_SETTINGS });

export const normalizeText = (value: string, acceptAccentsOptional = true): string => {
  let normalized = value
    .trim()
    .toLowerCase()
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (match) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(match).toString());

  if (acceptAccentsOptional) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  return normalized
    .replace(/\s+/g, ' ')
    .replace(/\s*([()])/g, '$1')
    .replace(/([()])\s*/g, '$1')
    .trim();
};

export const normalizeFormula = (value: string): string => normalizeText(value, false).replace(/\^/g, '').replace(/\s+/g, '');

export const isCompoundAllowed = (compound: CompoundEntry, settings: Settings) => {
  const typeAllowed = settings.activeTypes.includes(compound.type);
  const difficultyAllowed = difficultyRank[compound.difficulty] <= difficultyRank[settings.difficulty];
  return typeAllowed && difficultyAllowed;
};

export const buildExercise = (
  compound: CompoundEntry,
  direction: PracticeDirection,
  nomenclature: Nomenclature,
): Exercise => {
  const primaryName = compound.names[nomenclature][0];
  return {
    id: `${compound.id}-${direction}-${nomenclature}`,
    compoundId: compound.id,
    direction,
    nomenclature,
    type: compound.type,
    difficulty: compound.difficulty,
    prompt:
      direction === 'formula_to_name'
        ? `Anomena la fórmula ${compound.formula} amb nomenclatura ${nomenclature}.`
        : `Escriu la fórmula de ${primaryName}.`,
    expected: direction === 'formula_to_name' ? compound.names[nomenclature] : [compound.formula],
    formula: compound.formula,
    explanation: compound.explanation,
    displayName: primaryName,
  };
};

export const getExercisePool = (settings: Settings): Exercise[] => {
  const compounds = COMPOUNDS.filter((compound) => isCompoundAllowed(compound, settings));
  const nomenclatures = settings.activeNomenclatures.length ? settings.activeNomenclatures : ['stock'];
  const exercises: Exercise[] = [];

  compounds.forEach((compound) => {
    nomenclatures.forEach((nomenclature) => {
      exercises.push(buildExercise(compound, 'formula_to_name', nomenclature));
      exercises.push(buildExercise(compound, 'name_to_formula', nomenclature));
    });
  });

  return exercises;
};

export const sampleExercises = (pool: Exercise[], count: number, seed = Date.now()): Exercise[] => {
  const source = [...pool];
  let currentSeed = seed;
  const random = () => {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };

  for (let i = source.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }

  return source.slice(0, Math.min(count, source.length));
};

export const evaluateAnswer = (exercise: Exercise, answer: string, settings: Settings): AnswerResult => {
  const normalizedUserAnswer =
    exercise.direction === 'name_to_formula'
      ? normalizeFormula(answer)
      : normalizeText(answer, settings.acceptAccentsOptional);

  const expected = exercise.expected.map((candidate) =>
    exercise.direction === 'name_to_formula'
      ? normalizeFormula(candidate)
      : normalizeText(candidate, settings.acceptAccentsOptional),
  );

  const isCorrect = expected.includes(normalizedUserAnswer);
  return {
    isCorrect,
    expected: exercise.expected,
    explanation: exercise.explanation,
    normalizedUserAnswer,
  };
};

export interface ProgressRecord {
  exerciseId: string;
  compoundId: string;
  type: CompoundType;
  nomenclature: Nomenclature;
  direction: PracticeDirection;
  isCorrect: boolean;
  answer: string;
  correctAnswer: string;
  timestamp: number;
}

export interface ExamRecord {
  id: string;
  score: number;
  percentage: number;
  correct: number;
  total: number;
  createdAt: number;
}

export interface ProgressState {
  stats: {
    totalCorrect: number;
    totalWrong: number;
    streak: number;
    bestStreak: number;
  };
  history: ProgressRecord[];
  examHistory: ExamRecord[];
  missedCompounds: Record<string, number>;
  missedTypes: Record<string, number>;
  missedNomenclatures: Record<string, number>;
}

export const defaultProgressState = (): ProgressState => ({
  stats: { totalCorrect: 0, totalWrong: 0, streak: 0, bestStreak: 0 },
  history: [],
  examHistory: [],
  missedCompounds: {},
  missedTypes: {},
  missedNomenclatures: {},
});

export const recordAnswer = (state: ProgressState, exercise: Exercise, answer: string, isCorrect: boolean): ProgressState => {
  const next = {
    ...state,
    stats: {
      totalCorrect: state.stats.totalCorrect + (isCorrect ? 1 : 0),
      totalWrong: state.stats.totalWrong + (isCorrect ? 0 : 1),
      streak: isCorrect ? state.stats.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(state.stats.bestStreak, state.stats.streak + 1) : state.stats.bestStreak,
    },
    history: [
      {
        exerciseId: exercise.id,
        compoundId: exercise.compoundId,
        type: exercise.type,
        nomenclature: exercise.nomenclature,
        direction: exercise.direction,
        isCorrect,
        answer,
        correctAnswer: exercise.expected[0],
        timestamp: Date.now(),
      },
      ...state.history,
    ].slice(0, 400),
    missedCompounds: { ...state.missedCompounds },
    missedTypes: { ...state.missedTypes },
    missedNomenclatures: { ...state.missedNomenclatures },
  };

  if (!isCorrect) {
    next.missedCompounds[exercise.compoundId] = (next.missedCompounds[exercise.compoundId] || 0) + 1;
    next.missedTypes[exercise.type] = (next.missedTypes[exercise.type] || 0) + 1;
    next.missedNomenclatures[exercise.nomenclature] = (next.missedNomenclatures[exercise.nomenclature] || 0) + 1;
  }

  return next;
};

export const recordExam = (state: ProgressState, exam: ExamRecord): ProgressState => ({
  ...state,
  examHistory: [exam, ...state.examHistory].slice(0, 20),
});

export const getReviewPool = (settings: Settings, progress: ProgressState): Exercise[] => {
  const allowed = COMPOUNDS.filter((compound) => isCompoundAllowed(compound, settings));
  const weakIds = Object.entries(progress.missedCompounds)
    .sort((a, b) => b[1] - a[1])
    .map(([compoundId]) => compoundId);

  const prioritized = weakIds
    .map((compoundId) => allowed.find((compound) => compound.id === compoundId))
    .filter(Boolean) as CompoundEntry[];

  const selected = prioritized.length ? prioritized : allowed;
  const boosted = selected.flatMap((compound) => {
    const nomenclatures = settings.activeNomenclatures.includes('stock')
      ? settings.activeNomenclatures
      : (['stock', ...settings.activeNomenclatures] as Nomenclature[]).slice(0, 3);

    return nomenclatures.flatMap((nomenclature) => [
      buildExercise(compound, 'formula_to_name', nomenclature),
      buildExercise(compound, 'name_to_formula', nomenclature),
      ...(compound.type === 'oxosales' || nomenclature === 'stock' ? [buildExercise(compound, 'formula_to_name', nomenclature)] : []),
    ]);
  });

  return boosted;
};

export const getTopicSummary = (progress: ProgressState) =>
  Object.entries(progress.missedTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ label: COMPOUND_TYPE_LABELS[type as CompoundType], count }));

export const getNomenclatureSummary = (progress: ProgressState) =>
  Object.entries(progress.missedNomenclatures)
    .sort((a, b) => b[1] - a[1])
    .map(([nomenclature, count]) => ({ label: nomenclature, count }));
