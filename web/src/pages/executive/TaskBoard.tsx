import React, { useState } from 'react';
import styles from './TaskBoard.module.css';
import { useExec } from '../../context/ExecutiveContext';
import { ReactSortable } from 'react-sortablejs';

const TaskBoard: React.FC = () => {
  const { execData, setExecData, updateTaskStatus, createTask } = useExec();
  const { tasks, events } = execData;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'mid', assignee: 'PR', dueDate: '', eventId: '' });

  const columns = [
    { id: 'backlog', title: 'Backlog', color: '' },
    { id: 'todo', title: 'To Do', color: '' },
    { id: 'in-progress', title: 'In Progress', color: 'var(--exec-sky)' },
    { id: 'review', title: 'Review', color: 'var(--exec-amber)' },
    { id: 'done', title: 'Done', color: 'var(--exec-lime)' },
  ];

  const updateTasks = (newColTasks: any[], status: string) => {
    const newArrivals = newColTasks.filter(t => t.status !== status);
    if (newArrivals.length > 0) {
      newArrivals.forEach(t => {
        updateTaskStatus(t.id, status);
      });
    } else {
      setExecData(prev => {
        const otherTasks = prev.tasks.filter(t => t.status !== status);
        const updatedColTasks = newColTasks.map(t => ({ ...t, status }));
        return { ...prev, tasks: [...otherTasks, ...updatedColTasks] };
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.eventId) return;
    
    // Call the context function which adds to Supabase and updates local state
    if (createTask) {
      await createTask(newTask.title, newTask.priority, newTask.assignee, newTask.dueDate, newTask.eventId);
    }
    
    setIsModalOpen(false);
    setNewTask({ title: '', priority: 'mid', assignee: 'PR', dueDate: '', eventId: '' });
  };

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>Task board</h1>
          <p>Everything in motion across the team, ranked and dated.</p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          + New Task
        </button>
      </div>

      <div className={styles.kanban}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div className={styles.kcol} key={col.id}>
              <div className={styles.kcolHead} style={{ color: col.color || 'inherit' }}>
                {col.title} <span className={styles.count}>{colTasks.length}</span>
              </div>
              <ReactSortable 
                list={colTasks} 
                setList={(newList) => updateTasks(newList, col.id)}
                group="kanban" 
                animation={150} 
                ghostClass={styles.sortableGhost}
                style={{ flex: 1, minHeight: '50px' }}
              >
                {colTasks.map(task => {
                  let pClass = styles.pLow;
                  if (task.priority === 'mid') pClass = styles.pMid;
                  if (task.priority === 'high') pClass = styles.pHigh;
                  
                  const isDone = task.status === 'done';
                  
                  return (
                    <div className={`${styles.kcard} ${pClass}`} key={task.id} style={{ opacity: isDone ? 0.55 : 1 }}>
                      <div className={styles.kcardTitle} style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</div>
                      <div className={styles.kcardFoot}>
                        <span className={styles.kcardTag}>{task.dueDate}</span>
                        <div className={styles.kcardAvatar}>{task.assignee}</div>
                      </div>
                    </div>
                  );
                })}
              </ReactSortable>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className={styles.formGroup}>
                <label>Event</label>
                <select 
                  value={newTask.eventId} 
                  onChange={e => setNewTask({...newTask, eventId: e.target.value})}
                  required
                >
                  <option value="">Select Event...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})} 
                  placeholder="e.g. Finalize venue booking"
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Priority</label>
                <select 
                  value={newTask.priority} 
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="mid">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Assign To (Initials)</label>
                <input 
                  type="text" 
                  value={newTask.assignee} 
                  onChange={e => setNewTask({...newTask, assignee: e.target.value.toUpperCase().substring(0, 2)})} 
                  placeholder="e.g. PR"
                  maxLength={2}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Deadline</label>
                <input 
                  type="date" 
                  value={newTask.dueDate} 
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})} 
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.createBtn}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskBoard;
