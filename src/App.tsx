import { AuthGuard } from './components/Auth/AuthGuard';
import { Sidebar } from './shared/layout/Sidebar';
import { Header } from './shared/layout/Header';
import { ChatPanel } from './shared/ui/ChatPanel';
import { DashboardView } from './modules/dashboard/DashboardView';
import { TasksView } from './modules/tasks/TasksView';
import { CareerView } from './modules/career/CareerView';
import { ScheduleView } from './modules/schedule/ScheduleView';
import { FinanceView } from './modules/finance/FinanceView';
import { HealthView } from './modules/health/HealthView';
import { LearningView } from './modules/learning/LearningView';
import { RelationshipsView } from './modules/relationships/RelationshipsView';
import { useAppStore } from './shared/stores/app.store';

function NodeApp() {
  const { view, chatOpen } = useAppStore();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#06091A', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'dashboard' && <DashboardView />}
          {view === 'schedule'  && <ScheduleView />}
          {view === 'tasks'     && <TasksView />}
          {view === 'finance'   && <FinanceView />}
          {view === 'health'    && <HealthView />}
          {view === 'learning'  && <LearningView />}
          {view === 'career'    && <CareerView />}
          {view === 'relations' && <RelationshipsView />}
        </div>
      </div>
      {chatOpen && <ChatPanel />}
    </div>
  );
}

export default function App() {
  return (
    <AuthGuard>
      <NodeApp />
    </AuthGuard>
  );
}
