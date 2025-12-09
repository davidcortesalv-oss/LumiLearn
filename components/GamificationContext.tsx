
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserStats, Subject, AppView, UserProfile, RankTier, Skill, Quest, Achievement, Reward, BackgroundState, LivingMapData, StoredFile } from '../types';
import { generateLivingMap, generateMapFromFile } from '../services/geminiService';
import { saveMapToStorage } from '../services/storageService';

interface GamificationContextType {
  user: UserProfile | null;
  updateUserAvatar: (avatar: string) => void;
  stats: UserStats;
  currentView: AppView;
  setView: (view: AppView) => void;
  gainXP: (amount: number) => void;
  loseEnergy: (amount: number) => void;
  gainEnergy: (amount: number) => void;
  upgradeSkill: (skillId: string) => void;
  completeQuest: (questId: string) => void;
  subjects: Subject[];
  selectedSubjectId: string | null;
  selectSubject: (id: string) => void;
  // Auth & Shop methods
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: any) => Promise<void>;
  buyReward: (rewardId: string) => boolean;
  
  // Background Task Management
  backgroundTasks: BackgroundState;
  activeMapData: LivingMapData | null;
  generateMapInBackground: (input: string | StoredFile, isFile: boolean) => Promise<void>;
  resetMapGeneration: () => void;
  isCloudSyncing: boolean;
}

// --- INITIAL DATA CONFIG ---

const INITIAL_SKILLS: Skill[] = [
  { id: 'memory', name: 'Memoria', level: 1, maxLevel: 10, icon: 'Brain', description: 'Mejora la retención a largo plazo.', bonus: '+2% XP en Repaso' },
  { id: 'logic', name: 'Lógica', level: 1, maxLevel: 10, icon: 'Puzzle', description: 'Facilita la resolución de problemas.', bonus: '+2% XP en Quiz' },
  { id: 'focus', name: 'Enfoque', level: 1, maxLevel: 10, icon: 'Eye', description: 'Aumenta la duración del Focus Mode.', bonus: '-5% Gasto Energía' },
  { id: 'creativity', name: 'Creatividad', level: 1, maxLevel: 10, icon: 'Palette', description: 'Mejora mapas mentales y arte.', bonus: '+5% Calidad IA' },
  { id: 'speed', name: 'Velocidad', level: 1, maxLevel: 10, icon: 'Zap', description: 'Acelera el aprendizaje rápido.', bonus: '+2% Streak Bonus' },
];

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Calentamiento Mental', description: 'Completa 1 Quiz rápido.', type: 'daily', progress: 0, target: 1, completed: false, rewardXP: 50, rewardGems: 10 },
  { id: 'q2', title: 'Arquitecto del Saber', description: 'Crea un Mapa Mental.', type: 'daily', progress: 0, target: 1, completed: false, rewardXP: 100, rewardGems: 20 },
  { id: 'q3', title: 'Maratón Semanal', description: 'Acumula 500 XP esta semana.', type: 'weekly', progress: 120, target: 500, completed: false, rewardXP: 500, rewardGems: 100 },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Primeros Pasos', description: 'Completa tu primer quiz.', icon: 'Footprints', unlockedAt: Date.now(), rarity: 'common' },
  { id: 'a2', title: 'Cartógrafo', description: 'Genera 5 mapas mentales.', icon: 'Map', rarity: 'rare' },
  { id: 'a3', title: 'Imparable', description: 'Racha de 7 días.', icon: 'Flame', rarity: 'epic' },
];

const INITIAL_REWARDS: Reward[] = [
  // Keeping rewards structure for data integrity but feature is disabled in UI
  { id: 'b1', name: 'Doble XP (1h)', description: 'Multiplica por 2 la XP ganada durante 1 hora.', category: 'booster', cost: 50, icon: 'Zap', unlocked: false },
  { id: 'b2', name: 'Pista IA', description: 'Revela la respuesta correcta en un Quiz.', category: 'booster', cost: 20, icon: 'Lightbulb', unlocked: false },
  { id: 'b3', name: 'Relleno de Energía', description: 'Restablece tu energía al 100%.', category: 'booster', cost: 30, icon: 'Battery', unlocked: false },
  { id: 't1', name: 'Tema Oscuro', description: 'Interfaz nocturna para estudiar sin fatiga.', category: 'theme', cost: 100, icon: 'Palette', unlocked: false },
  { id: 'a1', name: 'Avatar Cyberpunk', description: 'Un avatar exclusivo de estilo futurista.', category: 'avatar', cost: 150, icon: 'Bot', unlocked: false },
];

const defaultStats: UserStats = {
  level: 1,
  xp: 450,
  xpToNextLevel: 1000,
  energy: 85,
  streak: 3,
  gems: 120,
  rank: RankTier.NOVICE,
  skillPoints: 1,
  skills: INITIAL_SKILLS,
  activeQuests: INITIAL_QUESTS,
  achievements: INITIAL_ACHIEVEMENTS,
  rewards: INITIAL_REWARDS
};

const defaultSubjects: Subject[] = [
  { id: 'math', name: 'Mates', icon: '📐', color: 'bg-blue-500', progress: 65 },
  { id: 'phys', name: 'Física', icon: '⚛️', color: 'bg-indigo-500', progress: 40 },
  { id: 'phil', name: 'Filosofía', icon: '🏛️', color: 'bg-yellow-500', progress: 25 },
  { id: 'chem', name: 'Química', icon: '🧪', color: 'bg-green-500', progress: 50 },
  { id: 'span', name: 'Castellano', icon: '📚', color: 'bg-red-500', progress: 60 },
  { id: 'cat', name: 'Catalán', icon: '🏰', color: 'bg-orange-500', progress: 55 },
  { id: 'eng', name: 'Inglés', icon: '💬', color: 'bg-pink-500', progress: 70 },
];

// Default "Guest" User
const DEFAULT_USER: UserProfile = {
    id: 'guest_user',
    name: 'Estudiante',
    email: 'guest@lumi.app',
    phone: '',
    avatar: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
    role: 'student',
    joinedAt: Date.now()
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

interface GamificationProviderProps {
  children?: ReactNode;
}

export const GamificationProvider = ({ children }: GamificationProviderProps) => {
  // Auth State - Always logged in as default user
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);

  // Game State
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [currentView, setView] = useState<AppView>(AppView.DASHBOARD);
  const [subjects] = useState<Subject[]>(defaultSubjects);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // Cloud Sync State
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Background Task State
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundState>({
      mapGenerator: 'idle',
      storyGenerator: 'idle'
  });
  const [activeMapData, setActiveMapData] = useState<LivingMapData | null>(null);

  // Load User from LocalStorage on mount (optional, to persist avatar changes)
  useEffect(() => {
    const savedUser = localStorage.getItem('lumi_user');
    const savedStats = localStorage.getItem('lumi_stats');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(DEFAULT_USER);
    }
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats({ ...defaultStats, ...parsedStats });
    }
    
    // Attempt to load persisted map draft if available
    const savedDraftMap = localStorage.getItem('lumi_map_draft');
    if (savedDraftMap) {
        setActiveMapData(JSON.parse(savedDraftMap));
        setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'success' }));
    }
  }, []);

  // Persist State
  useEffect(() => {
    setIsCloudSyncing(true);
    if (user) {
        localStorage.setItem('lumi_user', JSON.stringify(user));
    }
    localStorage.setItem('lumi_stats', JSON.stringify(stats));
    
    // Simulate Cloud Sync Delay
    const timeout = setTimeout(() => setIsCloudSyncing(false), 800);
    return () => clearTimeout(timeout);
  }, [user, stats]);


  const updateUserAvatar = (avatar: string) => {
    if (user) {
      const updatedUser = { ...user, avatar };
      setUser(updatedUser);
    }
  };

  const selectSubject = (id: string) => setSelectedSubjectId(id);

  // --- BACKGROUND TASKS IMPLEMENTATION ---

  const generateMapInBackground = async (input: string | StoredFile, isFile: boolean) => {
      setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'loading' }));
      setActiveMapData(null); // Clear previous

      try {
          let data: LivingMapData | null = null;
          
          if (isFile) {
              const file = input as StoredFile;
              // Check for pre-processed text to be faster
              if (file.extractedContent && file.extractedContent.length > 50) {
                  data = await generateLivingMap(file.extractedContent);
              } else {
                  data = await generateMapFromFile(file.data, file.type);
              }
          } else {
              data = await generateLivingMap(input as string);
          }

          if (data) {
              // Ensure critical properties
              if (!data.nodes[0].mastery) {
                 data.nodes = data.nodes.map(n => ({...n, expanded: true, mastery: Math.floor(Math.random() * 30)}));
              }
              
              setActiveMapData(data);
              setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'success' }));
              
              // AUTO SAVE TO CLOUD (LOCALSTORAGE)
              localStorage.setItem('lumi_map_draft', JSON.stringify(data));
              // Auto-save to saved maps library immediately
              saveMapToStorage("Mapa Auto-generado " + new Date().toLocaleTimeString(), data);
              setIsCloudSyncing(true);
              setTimeout(() => setIsCloudSyncing(false), 1000);
          } else {
              setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'error' }));
          }

      } catch (e) {
          console.error("Background Map Gen Error", e);
          setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'error' }));
      }
  };

  const resetMapGeneration = () => {
      setBackgroundTasks(prev => ({ ...prev, mapGenerator: 'idle' }));
      setActiveMapData(null);
      localStorage.removeItem('lumi_map_draft');
  };

  // --- RPG LOGIC ---

  const determineRank = (totalXP: number): RankTier => {
    if (totalXP < 500) return RankTier.NOVICE;
    if (totalXP < 1500) return RankTier.BRONZE;
    if (totalXP < 3000) return RankTier.SILVER;
    if (totalXP < 6000) return RankTier.GOLD;
    if (totalXP < 10000) return RankTier.PLATINUM;
    if (totalXP < 15000) return RankTier.DIAMOND;
    if (totalXP < 25000) return RankTier.MASTER;
    if (totalXP < 50000) return RankTier.GRANDMASTER;
    if (totalXP < 100000) return RankTier.ASCENDANT;
    return RankTier.LUMEN_MYTHIC;
  };

  const gainXP = (amount: number) => {
    setStats((prev) => {
      // Calculate Boosters from Skills
      const speedSkill = prev.skills.find(s => s.id === 'speed');
      const speedBonus = speedSkill ? 1 + (speedSkill.level * 0.02) : 1;
      
      const boostedAmount = Math.floor(amount * speedBonus);
      
      let newXP = prev.xp + boostedAmount;
      let newLevel = prev.level;
      let newNextXP = prev.xpToNextLevel;
      let newSkillPoints = prev.skillPoints;

      // Level Up Logic
      if (newXP >= prev.xpToNextLevel) {
        newXP -= prev.xpToNextLevel;
        newLevel += 1;
        newNextXP = Math.floor(newNextXP * 1.3); // Curve gets steeper
        newSkillPoints += 1; // Award Skill Point
      }

      const lifetimeXP = (prev.level * 1000) + prev.xp + boostedAmount; 
      const newRank = determineRank(lifetimeXP);

      return { 
        ...prev, 
        xp: newXP, 
        level: newLevel, 
        xpToNextLevel: newNextXP,
        rank: newRank,
        skillPoints: newSkillPoints
      };
    });
  };

  const loseEnergy = (amount: number) => {
    setStats(prev => {
        const focusSkill = prev.skills.find(s => s.id === 'focus');
        const reduction = focusSkill ? (focusSkill.level * 0.05) : 0;
        const finalAmount = Math.floor(amount * (1 - reduction));
        return { ...prev, energy: Math.max(0, prev.energy - finalAmount) };
    });
  };

  const gainEnergy = (amount: number) => {
     setStats(prev => ({ ...prev, energy: Math.min(100, prev.energy + amount) }));
  };

  const upgradeSkill = (skillId: string) => {
    setStats(prev => {
      if (prev.skillPoints <= 0) return prev;
      
      const newSkills = prev.skills.map(s => {
        if (s.id === skillId && s.level < s.maxLevel) {
          return { ...s, level: s.level + 1 };
        }
        return s;
      });

      const oldLevel = prev.skills.find(s => s.id === skillId)?.level || 0;
      const newLevel = newSkills.find(s => s.id === skillId)?.level || 0;
      
      return {
        ...prev,
        skills: newSkills,
        skillPoints: newLevel > oldLevel ? prev.skillPoints - 1 : prev.skillPoints
      };
    });
  };

  const completeQuest = (questId: string) => {
    setStats(prev => {
      const questIndex = prev.activeQuests.findIndex(q => q.id === questId);
      if (questIndex === -1 || prev.activeQuests[questIndex].completed) return prev;

      const quest = prev.activeQuests[questIndex];
      const newXP = prev.xp + quest.rewardXP; 
      
      const updatedQuests = [...prev.activeQuests];
      updatedQuests[questIndex] = { ...quest, completed: true, progress: quest.target };

      return {
        ...prev,
        xp: prev.xp + quest.rewardXP, 
        gems: prev.gems + quest.rewardGems,
        activeQuests: updatedQuests
      };
    });
    gainXP(stats.activeQuests.find(q => q.id === questId)?.rewardXP || 0);
  };

  // --- AUTH & REWARDS LOGIC (Added) ---

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demo: Accept any non-empty credentials
    if (email && pass) {
        // Construct a user profile or retrieve existing if we had a backend
        const loggedUser: UserProfile = {
            id: email, // Use email as ID for persistence in this demo
            name: email.split('@')[0],
            email: email,
            phone: '',
            avatar: user?.avatar || DEFAULT_USER.avatar,
            role: 'student',
            joinedAt: user?.joinedAt || Date.now()
        };
        setUser(loggedUser);
        return true;
    }
    return false;
  };

  const register = async (data: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: UserProfile = {
        id: data.email,
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar || DEFAULT_USER.avatar,
        role: 'student',
        joinedAt: Date.now()
    };
    setUser(newUser);
  };

  const buyReward = (rewardId: string): boolean => {
    const reward = stats.rewards.find(r => r.id === rewardId);
    
    if (!reward) return false;
    if (reward.unlocked) return false; // Already owned
    if (stats.gems < reward.cost) return false; // Too expensive

    setStats(prev => {
        const idx = prev.rewards.findIndex(r => r.id === rewardId);
        if (idx === -1) return prev;

        const newRewards = [...prev.rewards];
        newRewards[idx] = { ...newRewards[idx], unlocked: true };

        return {
            ...prev,
            gems: prev.gems - reward.cost,
            rewards: newRewards
        };
    });
    return true;
  };

  return (
    <GamificationContext.Provider value={{ 
      user,
      updateUserAvatar,
      stats, 
      currentView, 
      setView, 
      gainXP, 
      loseEnergy, 
      gainEnergy,
      upgradeSkill,
      completeQuest,
      subjects,
      selectedSubjectId,
      selectSubject,
      login,
      register,
      buyReward,
      backgroundTasks,
      activeMapData,
      generateMapInBackground,
      resetMapGeneration,
      isCloudSyncing
    }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within GamificationProvider");
  return context;
};
