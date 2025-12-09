

import React, { useState } from 'react';
import { useGamification } from '../components/GamificationContext';
import { RankTier, RewardCategory } from '../types';
import { 
  Trophy, Star, Crown, Lock, Unlock, Zap, Brain, 
  Palette, Eye, Puzzle, CheckCircle, Flame, Target, 
  Shield, Medal, Sparkles, ShoppingBag, Lightbulb, Battery, 
  Bot, Leaf, Wand2
} from 'lucide-react';

// --- RANK DATA ---
const RANKS: Record<RankTier, { color: string, icon: any, req: number, desc: string }> = {
  [RankTier.NOVICE]: { color: 'from-gray-400 to-slate-500', icon: Shield, req: 0, desc: 'El comienzo del viaje.' },
  [RankTier.BRONZE]: { color: 'from-amber-600 to-amber-800', icon: Medal, req: 500, desc: 'Primeros pasos hacia la maestría.' },
  [RankTier.SILVER]: { color: 'from-slate-300 to-slate-400', icon: Medal, req: 1500, desc: 'Constancia probada.' },
  [RankTier.GOLD]: { color: 'from-yellow-300 to-yellow-500', icon: Crown, req: 3000, desc: 'Brillas con conocimiento.' },
  [RankTier.PLATINUM]: { color: 'from-cyan-300 to-cyan-500', icon: Star, req: 6000, desc: 'Excelencia académica.' },
  [RankTier.DIAMOND]: { color: 'from-blue-400 to-indigo-600', icon: Star, req: 10000, desc: 'Resistencia y claridad.' },
  [RankTier.MASTER]: { color: 'from-purple-500 to-fuchsia-600', icon: Trophy, req: 15000, desc: 'Autoridad en la materia.' },
  [RankTier.GRANDMASTER]: { color: 'from-red-500 to-rose-700', icon: Trophy, req: 25000, desc: 'Leyenda del aprendizaje.' },
  [RankTier.ASCENDANT]: { color: 'from-indigo-400 via-purple-400 to-pink-400', icon: Sparkles, req: 50000, desc: 'Más allá de los límites.' },
  [RankTier.LUMEN_MYTHIC]: { color: 'from-white via-yellow-200 to-pink-300 text-gray-800', icon: Crown, req: 100000, desc: 'Luz pura de sabiduría.' }
};

// --- ICONS MAPPING ---
const ICONS_MAP: Record<string, any> = {
  Brain: Brain,
  Puzzle: Puzzle,
  Eye: Eye,
  Palette: Palette,
  Zap: Zap,
  Footprints: Shield,
  Map: Target,
  Flame: Flame,
  Lightbulb: Lightbulb,
  Battery: Battery,
  Bot: Bot,
  Leaf: Leaf,
  Crown: Crown,
  Wand2: Wand2
};

export const RankSystem = () => {
  const { stats, upgradeSkill, completeQuest, buyReward } = useGamification();
  const [shopFilter, setShopFilter] = useState<RewardCategory | 'all'>('all');

  // Helper to find next rank
  const rankKeys = Object.values(RankTier);
  const currentRankIndex = rankKeys.indexOf(stats.rank);
  const nextRank = rankKeys[currentRankIndex + 1];
  const nextRankData = nextRank ? RANKS[nextRank as RankTier] : null;
  const currentRankData = RANKS[stats.rank];

  // Calculate Progress (Approximate for visual)
  const baseXP = currentRankData.req;
  const targetXP = nextRankData ? nextRankData.req : baseXP * 2;
  const lifetimeXP = (stats.level * 1000) + stats.xp; // Approximate lifetime XP
  const progressPercent = nextRankData 
    ? Math.min(100, Math.max(0, ((lifetimeXP - baseXP) / (targetXP - baseXP)) * 100))
    : 100;

  // Filter rewards
  const filteredRewards = stats.rewards.filter(r => shopFilter === 'all' || r.category === shopFilter);

  const handleBuy = (id: string) => {
    const success = buyReward(id);
    if (!success) {
      // Could add toast here
      alert("No tienes suficientes gemas o ya tienes este objeto.");
    }
  };

  return (
    <div className="space-y-8 pb-10 animate-[fadeIn_0.5s_ease-out]">
      
      {/* 1. HERO RANK SECTION */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gray-900 text-white shadow-2xl p-8 md:p-12">
        {/* Dynamic Background based on Rank */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentRankData.color} opacity-20`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
           <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br ${currentRankData.color} p-1 shadow-[0_0_60px_rgba(255,255,255,0.3)] flex items-center justify-center shrink-0`}>
              <div className="w-full h-full bg-black/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                 <currentRankData.icon className="w-20 h-20 md:w-28 md:h-28 text-white drop-shadow-md" strokeWidth={1} />
              </div>
           </div>

           <div className="flex-1 text-center md:text-left">
              <div className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold tracking-widest uppercase mb-4">
                 Rango Actual
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
                 {stats.rank}
              </h1>
              <p className="text-xl text-white/70 font-medium mb-8 max-w-xl">
                 {currentRankData.desc}
              </p>

              {nextRankData ? (
                <div className="max-w-xl">
                   <div className="flex justify-between text-sm font-bold text-white/60 mb-2">
                      <span>Progreso a {nextRank}</span>
                      <span>{Math.floor(lifetimeXP)} / {nextRankData.req} XP</span>
                   </div>
                   <div className="h-4 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                      <div className="h-full bg-white shadow-[0_0_20px_white]" style={{width: `${progressPercent}%`}}></div>
                   </div>
                </div>
              ) : (
                <div className="text-yellow-300 font-bold flex items-center gap-2">
                   <Crown /> Rango Máximo Alcanzado
                </div>
              )}
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. SKILL TREE */}
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-current"/> Árbol de Habilidades
                 </h2>
                 <p className="text-gray-500 text-sm">Mejora tus capacidades cognitivas</p>
              </div>
              <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 font-bold text-sm border border-indigo-100">
                 Puntos Disponibles: <span className="text-xl ml-1">{stats.skillPoints}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.skills.map((skill) => {
                 const Icon = ICONS_MAP[skill.icon] || Zap;
                 const canUpgrade = stats.skillPoints > 0 && skill.level < skill.maxLevel;
                 
                 return (
                    <button 
                       key={skill.id}
                       onClick={() => canUpgrade && upgradeSkill(skill.id)}
                       disabled={!canUpgrade && skill.level < skill.maxLevel}
                       className={`
                          relative p-6 rounded-3xl border-2 text-left transition-all group overflow-hidden
                          ${skill.level > 0 ? 'bg-white border-gray-100 hover:border-indigo-200' : 'bg-gray-50 border-gray-100 opacity-70'}
                       `}
                    >
                       {/* Level Bar Background */}
                       <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-100 w-full">
                          <div className="h-full bg-indigo-500 transition-all" style={{width: `${(skill.level / skill.maxLevel) * 100}%`}}></div>
                       </div>

                       <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${skill.level > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-400'}`}>
                             <Icon size={24} />
                          </div>
                          <div className="text-right">
                             <span className="text-xs font-bold text-gray-400 uppercase">Nivel</span>
                             <p className="text-xl font-black text-gray-800">{skill.level}/{skill.maxLevel}</p>
                          </div>
                       </div>
                       
                       <h3 className="font-bold text-lg text-gray-800 mb-1">{skill.name}</h3>
                       <p className="text-xs text-gray-500 mb-3 min-h-[2.5em]">{skill.description}</p>
                       <p className="text-xs font-bold text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded-md">
                          Bonus: {skill.bonus}
                       </p>

                       {/* Hover Upgrade Overlay */}
                       {canUpgrade && (
                          <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                             <div className="text-white font-bold flex items-center gap-2">
                                <Unlock size={18}/> Mejorar
                             </div>
                          </div>
                       )}
                    </button>
                 );
              })}
           </div>
        </section>

        {/* 3. QUESTS & ACHIEVEMENTS SIDEBAR */}
        <div className="space-y-8">
           
           {/* QUESTS */}
           <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                 <Target className="text-red-500"/> Misiones Activas
              </h2>
              <div className="space-y-4">
                 {stats.activeQuests.map(quest => (
                    <div key={quest.id} className={`p-4 rounded-2xl border ${quest.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <h4 className={`font-bold text-sm ${quest.completed ? 'text-green-800' : 'text-gray-800'}`}>{quest.title}</h4>
                             <p className="text-xs text-gray-500">{quest.description}</p>
                          </div>
                          {quest.completed ? (
                             <CheckCircle className="text-green-500 w-5 h-5"/>
                          ) : (
                             <span className="text-[10px] font-bold bg-white px-2 py-1 rounded border text-gray-400 uppercase">{quest.type}</span>
                          )}
                       </div>
                       
                       {/* Rewards */}
                       {!quest.completed && (
                          <div className="flex items-center gap-3 mt-3 text-xs font-bold text-gray-400">
                             <span className="flex items-center gap-1 text-indigo-400"><Star size={12}/> +{quest.rewardXP} XP</span>
                             <span className="flex items-center gap-1 text-yellow-500"><Zap size={12}/> +{quest.rewardGems}</span>
                          </div>
                       )}
                       
                       {/* Progress Bar */}
                       <div className="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                           <div className={`h-full transition-all ${quest.completed ? 'bg-green-500' : 'bg-indigo-500'}`} style={{width: `${(quest.progress / quest.target) * 100}%`}}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>

           {/* ACHIEVEMENTS */}
           <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                 <Trophy className="text-yellow-500"/> Logros
              </h2>
              <div className="grid grid-cols-3 gap-2">
                 {stats.achievements.map(ach => {
                    const Icon = ICONS_MAP[ach.icon] || Star;
                    const rarityColors = {
                       common: 'bg-gray-100 text-gray-400',
                       rare: 'bg-blue-50 text-blue-500 border-blue-100',
                       epic: 'bg-purple-50 text-purple-500 border-purple-100',
                       legendary: 'bg-yellow-50 text-yellow-500 border-yellow-100'
                    };
                    
                    return (
                       <div key={ach.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border ${rarityColors[ach.rarity]} hover:scale-105 transition-transform cursor-help`} title={ach.description}>
                          <Icon size={24} className="mb-1"/>
                          <span className="text-[10px] font-bold text-center leading-tight">{ach.title}</span>
                       </div>
                    );
                 })}
                 {/* Locked Slots Placeholders */}
                 {[1,2,3].map(i => (
                    <div key={i} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center opacity-50">
                       <Lock size={20} className="text-gray-300"/>
                    </div>
                 ))}
              </div>
           </section>

        </div>
      </div>

      {/* 4. REWARDS MARKET SECTION */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
               <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                  <ShoppingBag className="text-pink-500"/> Mercado Lumi
               </h2>
               <p className="text-gray-500 font-medium">Canjea tus gemas por recompensas exclusivas.</p>
            </div>
            
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-6 py-3 rounded-2xl">
               <Zap className="text-yellow-500 fill-current w-6 h-6 animate-pulse"/>
               <div>
                  <span className="text-xs font-bold text-yellow-600 uppercase block">Tus Gemas</span>
                  <span className="text-2xl font-black text-gray-800 leading-none">{stats.gems}</span>
               </div>
            </div>
         </div>

         {/* Filters */}
         <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
             {['all', 'booster', 'theme', 'avatar'].map(cat => (
                <button
                   key={cat}
                   onClick={() => setShopFilter(cat as any)}
                   className={`px-6 py-2 rounded-xl font-bold capitalize transition-all whitespace-nowrap ${
                      shopFilter === cat 
                      ? 'bg-gray-800 text-white shadow-lg' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                   }`}
                >
                   {cat === 'all' ? 'Todo' : cat === 'booster' ? 'Potenciadores' : cat === 'theme' ? 'Temas' : 'Avatares'}
                </button>
             ))}
         </div>

         {/* Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredRewards.map(reward => {
               const Icon = ICONS_MAP[reward.icon] || Star;
               const canAfford = stats.gems >= reward.cost;
               const isOwned = reward.unlocked;

               return (
                  <div key={reward.id} className={`group relative p-6 rounded-3xl border-2 transition-all hover:-translate-y-1 ${isOwned ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-pink-200 hover:shadow-xl'}`}>
                     
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                        isOwned ? 'bg-green-100 text-green-600' : 
                        reward.category === 'booster' ? 'bg-yellow-100 text-yellow-600' :
                        reward.category === 'theme' ? 'bg-purple-100 text-purple-600' :
                        'bg-pink-100 text-pink-600'
                     }`}>
                        <Icon size={28} />
                     </div>

                     <h3 className="font-bold text-gray-800 text-lg mb-1">{reward.name}</h3>
                     <p className="text-xs text-gray-500 mb-4 h-8 leading-snug">{reward.description}</p>
                     
                     {isOwned ? (
                        <button disabled className="w-full py-3 bg-green-200 text-green-800 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                           <CheckCircle size={18}/> Desbloqueado
                        </button>
                     ) : (
                        <button 
                           onClick={() => handleBuy(reward.id)}
                           disabled={!canAfford}
                           className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                              canAfford 
                              ? 'bg-gray-900 text-white hover:bg-pink-500 shadow-md' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                           }`}
                        >
                           {canAfford ? 'Comprar' : 'Insuficiente'}
                           <span className="flex items-center text-xs opacity-80">
                              <Zap size={12} className="fill-current mr-1"/> {reward.cost}
                           </span>
                        </button>
                     )}
                  </div>
               );
            })}
         </div>
      </section>
    </div>
  );
};