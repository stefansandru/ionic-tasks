// import { useCallback, useEffect, useState } from 'react';
import { useCallback, useEffect, useReducer } from 'react';
import { getLogger } from '../core';
import { TaskProps } from './TaskProps';
import { getItems, addItem, removeItem } from './itemApi';

const log = getLogger('useTasks');

export interface TasksState {
  tasks?: TaskProps[];
  fetching: boolean;
  fetchingError?: Error;
}

export interface TasksProps extends TasksState {
  addTask: () => void;
  removeTask: (id?: string) => void;
}

export const useTasks = (initial: TaskProps[] = [
  { id: '1', text: 'Learn React' },
  { id: '2', text: 'Learn Ionic' }
]): TasksProps => {

  interface ActionProps {
    type: string; 
    payload?: any 
}

  const initialState: TasksState = {
    tasks: initial,
    fetching: false,
    fetchingError: undefined,
  };

  // const [fetching, setFetching] = useState<boolean>(false);
  // const [tasks, setTasks] = useState<TaskProps[]>();
  // const [fetchingError, setFetchingError] = useState<Error>();

  const FETCH_TASKS_STARTED = 'FETCH_TASKS_STARTED';
  const FETCH_TASKS_SUCCEEDED = 'FETCH_TASKS_SUCCEEDED';
  const FETCH_TASKS_FAILED = 'FETCH_TASKS_FAILED';
  const ADD_TASK = 'ADD_TASK';
  const REMOVE_TASK = 'REMOVE_TASK';

  const reducer: (state: TasksState, action: ActionProps) => TasksState =
    (state, { type, payload }) => {
      switch (type) {
        case FETCH_TASKS_STARTED:
          return { ...state, fetching: true, fetchingError: undefined };
        case FETCH_TASKS_SUCCEEDED:
          return { ...state, tasks: payload.tasks, fetching: false };
        case FETCH_TASKS_FAILED:
          return { ...state, fetchingError: payload.error, fetching: false };
        case ADD_TASK:
          return { ...state, tasks: state.tasks ? [payload.task, ...state.tasks] : [payload.task] };
        case REMOVE_TASK:
          return { ...state, tasks: state.tasks?.filter(t => t.id !== payload.id) };
        default:
          return state;
      }
    };

  const [state, dispatch] = useReducer(reducer, initialState);
  const { tasks, fetching, fetchingError } = state;

  const addTask = useCallback(() => {
    log('addTask');
    // call backend to add the item
    (async () => {
      try {
        const newTask = await addItem({ text: `New task ${Date.now()}` });
        // setTasks(prev => prev ? [newTask, ...prev] : [newTask]);
        dispatch({ type: ADD_TASK, payload: { task: newTask } });
      } catch (err) {
        log('addTask failed', err);
        // setFetchingError(err as Error);
        dispatch({ type: FETCH_TASKS_FAILED, payload: { error: err as Error } });
      }
    })();
  }, []);

  const removeTask = useCallback((id?: string) => {
    if (!id) return;
    (async () => {
      try {
        await removeItem(id);
        // setTasks(prev => prev?.filter(t => t.id !== id));
        dispatch({ type: REMOVE_TASK, payload: { id } });
      } catch (err) {
        log('removeTask failed', err);
        // setFetchingError(err as Error);
        dispatch({ type: FETCH_TASKS_FAILED, payload: { error: err as Error } });
      }
    })();
  }, []);

  useEffect(getTasksEffect, []);

  log(`returns - fetching = ${fetching}, tasks = ${JSON.stringify(tasks)}`);

  return {
    tasks,
    fetching,
    fetchingError,
    addTask,
    removeTask,
  };

  function getTasksEffect() {
    let canceled = false;
    const controller = new AbortController();
    fetchTasks();
    return () => {
      canceled = true;
      try { controller.abort(); } catch (e) { /* noop */ }
    };

    async function fetchTasks() {
      try {
  log('fetchTasks started');
  // setFetching(true);
  dispatch({ type: FETCH_TASKS_STARTED });
  const items = await getItems(controller.signal);
        // if (!canceled) { setFetching(false); setTasks(items); }
        if (!canceled) {
          dispatch({ type: FETCH_TASKS_SUCCEEDED, payload: { tasks: items } });
        }
        log('fetchTasks succeeded');
      } catch (error) {
        log('fetchTasks failed', error);
        if (!canceled) {
          // setFetching(false); setFetchingError(error as Error);
          dispatch({ type: FETCH_TASKS_FAILED, payload: { error } });
        }
      }
    }
  }
};

export default useTasks;
// ...existing code...