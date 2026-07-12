import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Tag, Folder, FolderOpen, ChevronRight, LayoutList, Columns3, GripVertical, Target } from 'lucide-react';
import { useTasksStore, type Priority, type Task, type TaskStatus, type Project } from '../../shared/stores/tasks.store';
import { useLearningStore, type LearningGoal } from '../../shared/stores/learning.store';
import { useWindowSize } from '../../shared/hooks/useWindowSize';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const C = {
  bg0: '#06091A', bg1: '#090D1F', bg2: '#0D1228', bg3: '#131B32',
  b0: 'rgba(255,255,255,0.04)', b1: 'rgba(255,255,255,0.08)',
  t0: '#DDE5F5', t1: '#556070', t2: '#253040',
  blue: '#3B8EF0', violet: '#7C5CF0', teal: '#00CCA0', amber: '#EFA020', rose: '#F05472', sky: '#58AEFF',
};
const font = '"Space Grotesk", system-ui, sans-serif';
const mono = '"JetBrains Mono", "Fira Code", monospace';

const PRIORITY_COLOR: Record<Priority, string> = {
  urgent: C.rose, high: C.amber, medium: C.sky, low: C.teal,
};
const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: '긴급', high: '높음', medium: '보통', low: '낮음',
};
const PROJECT_PALETTE = [C.blue, C.violet, C.teal, C.amber, C.sky, C.rose];

function projColor(projects: Project[], projectId?: string): string {
  if (!projectId) return C.t2;
  const idx = projects.findIndex((p) => p.id === projectId);
  return PROJECT_PALETTE[idx % PROJECT_PALETTE.length] ?? C.sky;
}

const inputStyle = {
  background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8,
  padding: '9px 12px', color: C.t0, fontSize: 13.5, fontFamily: font,
  outline: 'none', width: '100%', boxSizing: 'border-box' as const,
};

type TabId = 'all' | 'kanban' | 'projects' | 'done';

interface TaskRowProps {
  task: Task;
  subtasks: Task[];
  projects: Project[];
  goals: LearningGoal[];
  toggle: (id: string, done: boolean) => void;
  remove: (id: string) => void;
  onAddSubtask: (parentId: string) => void;
  indent?: boolean;
}

function TaskRow({ task, subtasks, projects, goals, toggle, remove, onAddSubtask, indent }: TaskRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = subtasks.length > 0;
  const col = projColor(projects, task.projectId);
  const linkedGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : undefined;

  return (
    <>
      <div style={{
        background: task.done ? C.bg1 : C.bg2,
        border: `1px solid ${task.done ? C.b0 : C.b1}`,
        borderRadius: 10, padding: '11px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 8, transition: 'all 0.14s',
        marginLeft: indent ? 22 : 0,
        borderLeft: indent ? `2px solid ${C.b1}` : undefined,
      }}>
        {hasSubtasks && !indent && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2, color: C.t1, cursor: 'pointer' }}
          >
            <ChevronRight size={11} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
        )}
        <button
          onClick={() => toggle(task.id, !task.done)}
          style={{ display: 'flex', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
        >
          {task.done
            ? <CheckCircle2 size={15} color={C.teal} style={{ filter: `drop-shadow(0 0 4px ${C.teal}80)` }} />
            : <Circle size={15} color={C.t2} />
          }
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            color: task.done ? C.t1 : C.t0, fontSize: 13.5,
            textDecoration: task.done ? 'line-through' : 'none',
            display: 'block',
          }}>{task.title}</span>
          {(task.projectId || linkedGoal || (task.tags ?? []).length > 0 || task.due) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, alignItems: 'center' }}>
              {task.projectId && (
                <span style={{
                  fontSize: 10, display: 'flex', alignItems: 'center', gap: 3,
                  color: col, background: `${col}18`, borderRadius: 5, padding: '2px 7px',
                }}>
                  <Folder size={8} />
                  {projects.find((p) => p.id === task.projectId)?.name ?? ''}
                </span>
              )}
              {linkedGoal && (
                <span style={{
                  fontSize: 10, display: 'flex', alignItems: 'center', gap: 3,
                  color: C.sky, background: `${C.sky}18`, borderRadius: 5, padding: '2px 7px',
                }}>
                  <Target size={8} />{linkedGoal.title}
                </span>
              )}
              {(task.tags ?? []).map((tag) => (
                <span key={tag} style={{
                  fontSize: 10, color: C.violet, background: `${C.violet}18`,
                  borderRadius: 5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <Tag size={7} />{tag}
                </span>
              ))}
              {task.due && (
                <span style={{ fontSize: 10, fontFamily: mono, color: C.t2 }}>{task.due}</span>
              )}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, flexShrink: 0, marginTop: 2,
          color: PRIORITY_COLOR[task.priority],
          background: `${PRIORITY_COLOR[task.priority]}18`,
          borderRadius: 5, padding: '2px 7px',
        }}>{PRIORITY_LABEL[task.priority]}</span>
        {!indent && !task.done && (
          <button
            onClick={() => onAddSubtask(task.id)}
            title="하위 작업 추가"
            style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 2 }}
          >
            <Plus size={11} />
          </button>
        )}
        <button
          onClick={() => remove(task.id)}
          style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0, marginTop: 2 }}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {hasSubtasks && expanded && subtasks.map((sub) => (
        <TaskRow
          key={sub.id}
          task={sub}
          subtasks={[]}
          projects={projects}
          goals={goals}
          toggle={toggle}
          remove={remove}
          onAddSubtask={onAddSubtask}
          indent
        />
      ))}
    </>
  );
}

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: '할 일', color: C.sky },
  { id: 'in_progress', label: '진행 중', color: C.amber },
  { id: 'done', label: '완료', color: C.teal },
];

function getTaskStatus(task: Task): TaskStatus {
  if (task.status) return task.status;
  return task.done ? 'done' : 'todo';
}

interface KanbanCardProps {
  task: Task;
  projects: Project[];
  onRemove: (id: string) => void;
  isDragOverlay?: boolean;
}

function KanbanCard({ task, projects, onRemove, isDragOverlay }: KanbanCardProps) {
  const projCol = projColor(projects, task.projectId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    background: C.bg2,
    border: `1px solid ${isDragging ? C.violet : C.b1}`,
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 8,
    opacity: isDragging ? 0.4 : 1,
    transform: CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    cursor: isDragOverlay ? 'grabbing' : 'default',
    boxShadow: isDragOverlay ? '0 8px 32px rgba(0,0,0,0.5)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <button
          {...attributes}
          {...listeners}
          style={{ color: C.t2, cursor: 'grab', display: 'flex', flexShrink: 0, marginTop: 2, touchAction: 'none' }}
          title="드래그해서 이동"
        >
          <GripVertical size={13} />
        </button>
        <span style={{ flex: 1, color: C.t0, fontSize: 13.5, lineHeight: 1.4 }}>{task.title}</span>
        <button onClick={() => onRemove(task.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
          <Trash2 size={12} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: PRIORITY_COLOR[task.priority],
          background: `${PRIORITY_COLOR[task.priority]}18`, borderRadius: 5, padding: '2px 7px',
        }}>{PRIORITY_LABEL[task.priority]}</span>
        {task.projectId && (
          <span style={{ fontSize: 10, color: projCol, background: `${projCol}18`, borderRadius: 5, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Folder size={8} />{projects.find((p) => p.id === task.projectId)?.name}
          </span>
        )}
        {task.due && <span style={{ fontSize: 10, fontFamily: mono, color: C.t2 }}>{task.due}</span>}
      </div>
    </div>
  );
}

interface AddTaskFormProps {
  projects: Project[];
  goals: LearningGoal[];
  parentLabel?: string;
  onSubmit: (data: { title: string; priority: Priority; due?: string; tags?: string[]; projectId?: string; goalId?: string }) => void;
  onCancel?: () => void;
}

function AddTaskForm({ projects, goals, parentLabel, onSubmit, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [due, setDue] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [projectId, setProjectId] = useState('');
  const [goalId, setGoalId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    onSubmit({ title: title.trim(), priority, due: due || undefined, tags: tags.length ? tags : undefined, projectId: projectId || undefined, goalId: goalId || undefined });
    setTitle(''); setDue(''); setTagsInput(''); setPriority('medium'); setProjectId(''); setGoalId('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {parentLabel && (
        <p style={{ color: C.violet, fontSize: 11.5, marginBottom: -4 }}>하위 작업: {parentLabel}</p>
      )}
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="할 일 제목" style={inputStyle} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
        >
          {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
          ))}
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ flex: 1, background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: C.t0, fontSize: 13, fontFamily: font, colorScheme: 'dark' }} />
      </div>
      <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="태그 (쉼표 구분, 예: 업무,중요)" style={inputStyle} />
      {!parentLabel && projects.length > 0 && (
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: projectId ? C.t0 : C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
        >
          <option value="">프로젝트 없음</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      {!parentLabel && goals.length > 0 && (
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          style={{ background: C.bg1, border: `1px solid ${C.b1}`, borderRadius: 8, padding: '8px 12px', color: goalId ? C.t0 : C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer' }}
        >
          <option value="">학습 목표 없음</option>
          {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={{ flex: 1, padding: '9px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer' }}>추가</button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '9px 16px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
        )}
      </div>
    </form>
  );
}

export function TasksView() {
  const { items, projects, loading, fetch, add, toggle, setStatus, remove, addProject, removeProject } = useTasksStore();
  const { goals: learningGoals } = useLearningStore();
  const { isMobile } = useWindowSize();
  const [tab, setTab] = useState<TabId>('all');
  const [showForm, setShowForm] = useState(false);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id;
    if (!overId) { setOverColumnId(null); return; }
    const colMatch = STATUS_COLUMNS.find((c) => c.id === overId);
    if (colMatch) { setOverColumnId(colMatch.id); return; }
    const overTask = items.find((t) => t.id === overId);
    if (overTask) setOverColumnId(getTaskStatus(overTask));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveId(null);
    setOverColumnId(null);
    if (!over) return;
    const activeTaskId = String(active.id);
    const overId = String(over.id);
    const colMatch = STATUS_COLUMNS.find((c) => c.id === overId);
    const targetStatus: TaskStatus | undefined = colMatch
      ? colMatch.id
      : getTaskStatus(items.find((t) => t.id === overId)!);
    if (targetStatus) {
      const currentStatus = getTaskStatus(items.find((t) => t.id === activeTaskId)!);
      if (currentStatus !== targetStatus) setStatus(activeTaskId, targetStatus);
    }
  };

  useEffect(() => { fetch(); }, [fetch]);

  const activeTasks = items.filter((t) => !t.done);
  const doneTasks = items.filter((t) => t.done);
  const allTags = Array.from(new Set(items.flatMap((t) => t.tags ?? [])));
  const urgent = activeTasks.filter((t) => t.priority === 'urgent').length;

  const filteredActive = activeTag
    ? activeTasks.filter((t) => (t.tags ?? []).includes(activeTag))
    : activeTasks;

  const topLevel = filteredActive.filter((t) => !t.parentTaskId);
  const subtasksMap: Record<string, Task[]> = {};
  filteredActive.filter((t) => t.parentTaskId).forEach((t) => {
    if (!subtasksMap[t.parentTaskId!]) subtasksMap[t.parentTaskId!] = [];
    subtasksMap[t.parentTaskId!].push(t);
  });

  const handleAdd = async (data: { title: string; priority: Priority; due?: string; tags?: string[]; projectId?: string; goalId?: string }) => {
    await add({ ...data, parentTaskId: addingParentId ?? undefined });
    setShowForm(false);
    setAddingParentId(null);
  };

  const openAddSubtask = (parentId: string) => {
    setAddingParentId(parentId);
    setShowForm(true);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    await addProject({ name: projectName.trim(), status: 'active' });
    setProjectName(''); setShowProjectForm(false);
  };

  const toggleProjectCollapse = (id: string) => {
    setCollapsedProjects((s) => ({ ...s, [id]: !s[id] }));
  };

  const tabBtn = (id: TabId, label: string, icon?: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        fontFamily: font, cursor: 'pointer', transition: 'all 0.14s',
        background: tab === id ? C.bg3 : 'transparent',
        border: `1px solid ${tab === id ? C.b1 : 'transparent'}`,
        color: tab === id ? C.t0 : C.t1,
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    >{icon}{label}</button>
  );

  return (
    <div style={{ fontFamily: font, display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Left column: list ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ color: C.t0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>할 일</h1>
        <p style={{ color: C.t1, fontSize: 12.5, marginTop: 3 }}>
          {loading ? '불러오는 중...' : `${items.length}개 중 ${doneTasks.length}개 완료${urgent ? ` · 긴급 ${urgent}개` : ''}`}
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 14,
        background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {tabBtn('all', '전체', <LayoutList size={12} />)}
        {tabBtn('kanban', '칸반', <Columns3 size={12} />)}
        {tabBtn('projects', `프로젝트`, <Folder size={12} />)}
        {tabBtn('done', `완료 (${doneTasks.length})`, <CheckCircle2 size={12} />)}
      </div>

      {/* All tab */}
      {tab === 'all' && (
        <>
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <button
                onClick={() => setActiveTag(null)}
                style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: font, cursor: 'pointer',
                  background: activeTag === null ? `${C.violet}20` : C.bg2,
                  border: `1px solid ${activeTag === null ? C.violet : C.b1}`,
                  color: activeTag === null ? C.violet : C.t1,
                }}
              >전체</button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: font, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: activeTag === tag ? `${C.violet}20` : C.bg2,
                    border: `1px solid ${activeTag === tag ? C.violet : C.b1}`,
                    color: activeTag === tag ? C.violet : C.t1,
                  }}
                >
                  <Tag size={9} />{tag}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topLevel.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                subtasks={subtasksMap[task.id] ?? []}
                projects={projects}
                goals={learningGoals}
                toggle={toggle}
                remove={remove}
                onAddSubtask={openAddSubtask}
              />
            ))}
            {topLevel.length === 0 && !loading && (
              <p style={{ color: C.t2, fontSize: 13, padding: '30px 0' }}>
                {activeTag ? `'${activeTag}' 태그의 할 일이 없습니다.` : '할 일이 없어요. 새 항목을 추가해보세요.'}
              </p>
            )}
          </div>

          {/* Subtask inline form */}
          {showForm && addingParentId && (
            <AddTaskForm
              projects={projects}
              goals={learningGoals}
              parentLabel={items.find((t) => t.id === addingParentId)?.title ?? ''}
              onSubmit={handleAdd}
              onCancel={() => { setShowForm(false); setAddingParentId(null); }}
            />
          )}
          {/* Mobile-only: add new task button */}
          {isMobile && !showForm && (
            <button
              onClick={() => { setAddingParentId(null); setShowForm(true); }}
              style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}
            >
              <Plus size={14} />새 할 일 추가
            </button>
          )}
          {isMobile && showForm && !addingParentId && (
            <AddTaskForm
              projects={projects}
              goals={learningGoals}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          )}
        </>
      )}

      {/* Kanban tab */}
      {tab === 'kanban' && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {STATUS_COLUMNS.map((col) => {
              const colTasks = items.filter((t) => getTaskStatus(t) === col.id && !t.parentTaskId);
              const isOver = overColumnId === col.id && dragActiveId !== null;
              return (
                <SortableContext
                  key={col.id}
                  id={col.id}
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{
                      background: isOver ? `${col.color}08` : C.bg1,
                      border: `1px solid ${isOver ? col.color + '50' : C.b0}`,
                      borderRadius: 12,
                      padding: 12,
                      transition: 'border-color 0.15s, background 0.15s',
                      minHeight: 120,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      <span style={{ color: col.color, fontSize: 12, fontWeight: 600 }}>{col.label}</span>
                      <span style={{ color: C.t2, fontSize: 11, fontFamily: mono, marginLeft: 'auto' }}>{colTasks.length}</span>
                    </div>
                    {colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        projects={projects}
                        onRemove={remove}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <p style={{ color: C.t2, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>없음</p>
                    )}
                  </div>
                </SortableContext>
              );
            })}
          </div>
          <DragOverlay>
            {dragActiveId ? (
              <KanbanCard
                task={items.find((t) => t.id === dragActiveId)!}
                projects={projects}
                onRemove={remove}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Projects tab */}
      {tab === 'projects' && (
        <>
          {[...projects.map((p) => ({ ...p })), { id: '', name: '프로젝트 없음', color: undefined, status: 'active' as const }].map((proj) => {
            const projTasks = activeTasks.filter((t) => (t.projectId ?? '') === proj.id && !t.parentTaskId);
            if (projTasks.length === 0 && proj.id === '') return null;
            const col = proj.id ? projColor(projects, proj.id) : C.t2;
            const isCollapsed = collapsedProjects[proj.id || '_none'] ?? false;
            return (
              <div key={proj.id || '_none'} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <button
                    onClick={() => toggleProjectCollapse(proj.id || '_none')}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', flex: 1 }}
                  >
                    {proj.id ? <FolderOpen size={14} color={col} /> : <Folder size={14} color={C.t2} />}
                    <span style={{ color: col, fontSize: 13.5, fontWeight: 600 }}>{proj.name}</span>
                    <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>({projTasks.length})</span>
                    <ChevronRight size={11} color={C.t2} style={{ transform: isCollapsed ? 'none' : 'rotate(90deg)', transition: 'transform 0.15s', marginLeft: 2 }} />
                  </button>
                  {proj.id && (
                    <button onClick={() => removeProject(proj.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
                    {projTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        subtasks={subtasksMap[task.id] ?? []}
                        projects={projects}
                        goals={learningGoals}
                        toggle={toggle}
                        remove={remove}
                        onAddSubtask={openAddSubtask}
                      />
                    ))}
                    {projTasks.length === 0 && (
                      <p style={{ color: C.t2, fontSize: 12, paddingLeft: 20 }}>할 일 없음</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {showProjectForm ? (
            <form onSubmit={handleAddProject} style={{ marginBottom: 12, background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 10, padding: '14px', display: 'flex', gap: 8 }}>
              <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="프로젝트 이름" style={{ ...inputStyle, marginBottom: 0 }} />
              <button type="submit" style={{ padding: '9px 16px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: font, cursor: 'pointer', whiteSpace: 'nowrap' }}>추가</button>
              <button type="button" onClick={() => setShowProjectForm(false)} style={{ padding: '9px 14px', background: C.bg1, border: `1px solid ${C.b1}`, color: C.t1, borderRadius: 8, fontSize: 13, fontFamily: font, cursor: 'pointer' }}>취소</button>
            </form>
          ) : (
            <button onClick={() => setShowProjectForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}>
              <Plus size={14} />새 프로젝트
            </button>
          )}

          {showForm && addingParentId && (
            <AddTaskForm
              projects={projects}
              goals={learningGoals}
              parentLabel={items.find((t) => t.id === addingParentId)?.title ?? ''}
              onSubmit={handleAdd}
              onCancel={() => { setShowForm(false); setAddingParentId(null); }}
            />
          )}
          {isMobile && !showForm && (
            <button
              onClick={() => { setAddingParentId(null); setShowForm(true); }}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, color: C.t1, fontSize: 13, fontFamily: font, cursor: 'pointer', padding: '8px 0' }}
            >
              <Plus size={14} />새 할 일 추가
            </button>
          )}
          {isMobile && showForm && !addingParentId && (
            <AddTaskForm
              projects={projects}
              goals={learningGoals}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          )}
        </>
      )}

      {/* Done tab */}
      {tab === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {doneTasks.map((task) => (
            <div key={task.id} style={{
              background: C.bg1, border: `1px solid ${C.b0}`, borderRadius: 10,
              padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <button onClick={() => toggle(task.id, false)} style={{ display: 'flex', cursor: 'pointer', flexShrink: 0 }}>
                <CheckCircle2 size={15} color={C.teal} style={{ filter: `drop-shadow(0 0 4px ${C.teal}80)` }} />
              </button>
              <span style={{ flex: 1, color: C.t1, fontSize: 13.5, textDecoration: 'line-through' }}>{task.title}</span>
              {task.due && <span style={{ fontSize: 10, fontFamily: mono, color: C.t2 }}>{task.due}</span>}
              <button onClick={() => remove(task.id)} style={{ color: C.t2, cursor: 'pointer', display: 'flex' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {doneTasks.length === 0 && (
            <p style={{ color: C.t2, fontSize: 13, padding: '30px 0' }}>완료된 할 일이 없습니다.</p>
          )}
        </div>
      )}
      </div>{/* end left column */}

      {/* ── Right panel: desktop add form + stats ── */}
      {!isMobile && (
        <div style={{ width: 272, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Quick stats */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>현황</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: '전체', value: items.length, color: C.blue },
                { label: '완료', value: doneTasks.length, color: C.teal },
                { label: '진행 중', value: activeTasks.length, color: C.violet },
                { label: '긴급', value: urgent, color: C.rose },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: C.bg1, borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: mono }}>{value}</div>
                  <div style={{ color: C.t1, fontSize: 11, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            {activeTasks.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: C.t1, fontSize: 11 }}>완료율</span>
                  <span style={{ color: C.t0, fontSize: 11, fontFamily: mono }}>{Math.round(doneTasks.length / items.length * 100)}%</span>
                </div>
                <div style={{ height: 4, background: C.b1, borderRadius: 2 }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.round(doneTasks.length / items.length * 100)}%`,
                    background: `linear-gradient(90deg, ${C.teal}, ${C.blue})`,
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Add task form (desktop always-visible) */}
          <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 12 }}>새 할 일</p>
            <AddTaskForm
              projects={projects}
              goals={learningGoals}
              onSubmit={handleAdd}
              onCancel={() => {}}
            />
          </div>

          {/* Projects quick list */}
          {projects.length > 0 && (
            <div style={{ background: C.bg2, border: `1px solid ${C.b1}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: C.t1, fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>프로젝트</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {projects.map((p, i) => {
                  const col = PROJECT_PALETTE[i % PROJECT_PALETTE.length];
                  const count = activeTasks.filter((t) => t.projectId === p.id).length;
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: C.t0, fontSize: 12.5 }}>{p.name}</span>
                      <span style={{ color: C.t2, fontSize: 11, fontFamily: mono }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
