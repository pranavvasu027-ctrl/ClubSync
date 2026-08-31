import React from 'react';
import styles from './TaskBoard.module.css';
import { useExec } from '../../context/ExecutiveContext';
import { ReactSortable } from 'react-sortablejs';

const TaskBoard: React.FC = () => {
  const { execData, setExecData, updateTaskStatus } = useExec();
  const { tasks } = execData;

  const columns = [
    { id: 'backlog', title: 'Backlog', color: '' },
    { id: 'todo', title: 'To Do', color: '' },
    { id: 'in-progress', title: 'In Progress', color: 'var(--exec-sky)' },
    { id: 'review', title: 'Review', color: 'var(--exec-amber)' },
    { id: 'done', title: 'Done', color: 'var(--exec-lime)' },
  ];

  const updateTasks = (newColTasks: any[], status: string) => {
    // If a task arrived in this column that didn't belong here before, update its status.
    const newArrivals = newColTasks.filter(t => t.status !== status);
    if (newArrivals.length > 0) {
      newArrivals.forEach(t => {
        // @ts-ignore
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

  return (
    <>
      <div className={styles.hero}>
        <div>
          <div className={styles.heroEyebrow}>Operate</div>
          <h1>Task board</h1>
          <p>Everything in motion across the team, ranked and dated.</p>
        </div>
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
    </>
  );
};

export default TaskBoard;
