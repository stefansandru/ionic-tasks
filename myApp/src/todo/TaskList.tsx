import React, { useContext, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonLoading,
  IonFooter,
  IonButton,
  IonText,
  IonModal,
} from '@ionic/react';
import TaskEdit from './TaskEdit';
import Task from './Task';
import { TaskProps } from './TaskProps';
import { add } from 'ionicons/icons';
// useTasks hook (kept for reference) - commented out because we now use context/provider
// import useTasks from './useTasks';
import { TaskContext } from './TaskProvider';
import { modalEnterAnimation, modalLeaveAnimation } from '../theme/animations';


const TaskList: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskProps | undefined>(undefined);

  // Previously we used the local hook directly:
  // const { tasks, addTask, removeTask, fetching, fetchingError } = useTasks();
  // Now we read the same values from the context provider (TaskProvider):
  const {
    tasks,
    addTask,
    updateTask,
    removeTask,
    fetching,
    fetchingError,
    loadNextPage,
    loadPreviousPage,
    pageSize,
    currentOffset,
    totalCount,
    hasMore,
  } = useContext(TaskContext);

  const pageSizeValue = pageSize || 1;
  const safeOffset = typeof currentOffset === 'number' ? currentOffset : 0;
  const currentPage = Math.floor(safeOffset / pageSizeValue) + 1;
  const totalPages = totalCount ? Math.max(1, Math.ceil(totalCount / pageSizeValue)) : undefined;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My App</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching tasks" />
        {tasks && (
          <IonList>
            {tasks.map((task) => {
              console.log('TaskList rendering Task with:', task);
              return (
                <Task
                  key={task._id || task.text}
                  {...task}
                  onRemove={removeTask}
                  onEdit={(task) => {
                    setTaskToEdit(task);
                    setShowModal(true);
                  }}
                />
              );
            })}
          </IonList>
        )}
        {(!tasks || tasks.length === 0) && !fetching && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            No tasks on this page.
          </div>
        )}
        {fetchingError && (
          <div>{fetchingError.message || 'Failed to fetch tasks'}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => {
            setTaskToEdit(undefined);
            setShowModal(true);
          }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        <IonModal
          isOpen={showModal}
          enterAnimation={modalEnterAnimation}
          leaveAnimation={modalLeaveAnimation}
          onDidDismiss={() => {
            setShowModal(false);
            setTaskToEdit(undefined);
          }}
        >
          <TaskEdit task={taskToEdit} onSave={(task) => {
            if (task._id) {
              updateTask && updateTask(task);
            } else {
              addTask && addTask(task);
            }
            setShowModal(false);
            setTaskToEdit(undefined);
          }} onCancel={() => {
            setShowModal(false);
            setTaskToEdit(undefined);
          }} />
        </IonModal>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
            <IonButton onClick={() => loadPreviousPage?.()} disabled={fetching || !loadPreviousPage || currentOffset === 0}>
              Previous
            </IonButton>
            <IonText>
              Page {currentPage}{totalPages ? ` / ${totalPages}` : ''}{totalCount ? ` • ${totalCount} items` : ''}
            </IonText>
            <IonButton onClick={() => loadNextPage?.()} disabled={fetching || !loadNextPage || !hasMore}>
              Next
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default TaskList;