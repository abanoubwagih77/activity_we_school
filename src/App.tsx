import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuestionBankView } from './components/QuestionBank/QuestionBankView';
import { ActivitiesListView } from './components/Activities/ActivitiesListView';
import { ActivityBuilderModal } from './components/Activities/ActivityBuilderModal';
import { ClassesView } from './components/Classes/ClassesView';
import { HistoryView } from './components/History/HistoryView';
import { SettingsView } from './components/Settings/SettingsView';
import { PresentationContainer } from './components/Presentation/PresentationContainer';
import { LoginView } from './components/Auth/LoginView';

const MainLayout: React.FC = () => {
  const { view, activeActivity, authUser, login } = useApp();
  const [isGlobalBuilderOpen, setIsGlobalBuilderOpen] = useState(false);

  // If user is not logged in, display the teacher login page
  if (!authUser) {
    return <LoginView onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">
      {/* Teacher Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {view === 'dashboard' && (
          <Dashboard onOpenCreateModal={() => setIsGlobalBuilderOpen(true)} />
        )}
        {view === 'activities' && <ActivitiesListView />}
        {view === 'question_bank' && <QuestionBankView />}
        {view === 'classes' && <ClassesView />}
        {view === 'history' && <HistoryView />}
        {view === 'settings' && <SettingsView />}
      </main>

      {/* Fullscreen / Projector Classroom Mode when activity is launched */}
      {activeActivity && <PresentationContainer />}

      {/* Global Activity Builder Modal */}
      {isGlobalBuilderOpen && (
        <ActivityBuilderModal onClose={() => setIsGlobalBuilderOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
