import { lazy, Suspense, useState } from 'react';
import { AuthGuard } from './components/Auth/AuthGuard';
import { Sidebar } from './shared/layout/Sidebar';
import { Header } from './shared/layout/Header';
import { ChatPanel } from './shared/ui/ChatPanel';
import { ToastContainer } from './shared/ui/ToastContainer';
import { useAppStore } from './shared/stores/app.store';
import { useWindowSize } from './shared/hooks/useWindowSize';

const DashboardView     = lazy(() => import('./modules/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })));
const TasksView         = lazy(() => import('./modules/tasks/TasksView').then((m) => ({ default: m.TasksView })));
const CareerView        = lazy(() => import('./modules/career/CareerView').then((m) => ({ default: m.CareerView })));
const ScheduleView      = lazy(() => import('./modules/schedule/ScheduleView').then((m) => ({ default: m.ScheduleView })));
const FinanceView       = lazy(() => import('./modules/finance/FinanceView').then((m) => ({ default: m.FinanceView })));
const HealthView        = lazy(() => import('./modules/health/HealthView').then((m) => ({ default: m.HealthView })));
const LearningView      = lazy(() => import('./modules/learning/LearningView').then((m) => ({ default: m.LearningView })));
const RelationshipsView = lazy(() => import('./modules/relationships/RelationshipsView').then((m) => ({ default: m.RelationshipsView })));

function NodeApp() {
  const { view, chatOpen } = useAppStore();
  const { isMobile } = useWindowSize();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#06091A', overflow: 'hidden' }}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: isMobile ? '12px 14px' : '16px 20px' }}>
          <Suspense fallback={null}>
            {view === 'dashboard' && <DashboardView />}
            {view === 'schedule'  && <ScheduleView />}
            {view === 'tasks'     && <TasksView />}
            {view === 'finance'   && <FinanceView />}
            {view === 'health'    && <HealthView />}
            {view === 'learning'  && <LearningView />}
            {view === 'career'    && <CareerView />}
            {view === 'relations' && <RelationshipsView />}
          </Suspense>
          </div>
        </div>
      </div>
      {isMobile && chatOpen ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
          <ChatPanel />
        </div>
      ) : (
        chatOpen && <ChatPanel />
      )}
      <ToastContainer />
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
