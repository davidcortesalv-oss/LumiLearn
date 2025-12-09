
import React from 'react';
import { GamificationProvider, useGamification } from './components/GamificationContext';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { SubjectChat } from './views/SubjectChat';
import { ConceptMap } from './views/ConceptMap';
import { QuizArena } from './views/QuizArena';
import { Planner } from './views/Planner';
import { StoryMode } from './views/StoryMode'; 
import { InfographicGenerator } from './views/InfographicGenerator';
import { Materials } from './views/Materials';
import { Assistant } from './views/Assistant'; // NEW
import { AppView } from './types';

const AppContent = () => {
  const { currentView } = useGamification();

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard />;
      case AppView.MATERIALS: return <Materials />;
      case AppView.ASSISTANT: return <Assistant />;
      case AppView.CHAT: return <SubjectChat />;
      case AppView.MAP_GENERATOR: return <ConceptMap />;
      case AppView.STORY: return <StoryMode />;
      case AppView.QUIZ: return <QuizArena />;
      case AppView.PLANNER: return <Planner />;
      case AppView.INFOGRAPHIC: return <InfographicGenerator />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
};

export default function App() {
  return (
    <GamificationProvider>
      <AppContent />
    </GamificationProvider>
  );
}