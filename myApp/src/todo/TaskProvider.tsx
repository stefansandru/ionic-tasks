import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { getLogger } from '../core';
import { TaskProps } from './TaskProps';
import { getItems, addItem, removeItem, newWebSocket, updateItem } from './itemApi';
import {
  enqueuePendingOperation,
  loadCachedTasks,
  loadPendingOperations,
  saveCachedTasks,
  savePendingOperations,
  PendingOperation,
} from './offlineStorage';
import { useServerStatus } from '../core/useServerStatus';

const log = getLogger('TaskProvider');

type SaveTaskFn = (task: TaskProps) => Promise<any>;

export interface TasksState {
  tasks?: TaskProps[];
  fetching: boolean;
  fetchingError?: Error | null;
  saving: boolean;
  savingError?: Error | null;
  addTask?: (task: TaskProps) => void;
  updateTask?: (task: TaskProps) => void;
  removeTask?: (id?: string) => void;
  loadNextPage?: () => void;
  loadPreviousPage?: () => void;
  pageSize: number;
  currentOffset: number;
  totalCount?: number;
  hasMore: boolean;
}

interface ActionProps {
  type: string;
  payload?: any;
}

const PAGE_SIZE = 7;

const initialState: TasksState = {
  fetching: false,
  saving: false,
  pageSize: PAGE_SIZE,
  currentOffset: 0,
  hasMore: false,
};

const FETCH_TASKS_STARTED = 'FETCH_TASKS_STARTED';
const FETCH_TASKS_SUCCEEDED = 'FETCH_TASKS_SUCCEEDED';
const FETCH_TASKS_FAILED = 'FETCH_TASKS_FAILED';
const SAVE_TASK_STARTED = 'SAVE_TASK_STARTED';
const SAVE_TASK_SUCCEEDED = 'SAVE_TASK_SUCCEEDED';
const SAVE_TASK_FAILED = 'SAVE_TASK_FAILED';
const REMOVE_TASK_STARTED = 'REMOVE_TASK_STARTED';
const REMOVE_TASK_SUCCEEDED = 'REMOVE_TASK_SUCCEEDED';
const REMOVE_TASK_FAILED = 'REMOVE_TASK_FAILED';

const getTaskId = (task?: TaskProps) => task?._id || (task as any)?.id;

const reducer: (state: TasksState, action: ActionProps) => TasksState =
  (state, { type, payload }) => {
    switch (type) {
      case FETCH_TASKS_STARTED:
        return { ...state, fetching: true, fetchingError: null };
      case FETCH_TASKS_SUCCEEDED: {
        const tasks = payload?.tasks ?? [];
        const offset = typeof payload?.offset === 'number' ? payload.offset : state.currentOffset;
        const total = typeof payload?.total === 'number' ? payload.total : state.totalCount;
        const limit = typeof payload?.limit === 'number' ? payload.limit : state.pageSize;
        const hasMore = typeof total === 'number'
          ? offset + (tasks?.length ?? 0) < total
          : (tasks?.length ?? 0) === limit;
        return {
          ...state,
          tasks,
          fetching: false,
          currentOffset: offset,
          totalCount: total,
          pageSize: limit,
          hasMore,
        };
      }
      case FETCH_TASKS_FAILED:
        return { ...state, fetchingError: payload.error, fetching: false };
      case SAVE_TASK_STARTED:
        return { ...state, savingError: null, saving: true };
      case SAVE_TASK_SUCCEEDED: {
        const tasks = [...(state.tasks || [])];
        const task: TaskProps = payload.task;
        const id = getTaskId(task);
        // if exists replace, else add to top
        const index = id ? tasks.findIndex(t => getTaskId(t) === id) : -1;
        if (index === -1) {
          tasks.splice(0, 0, task);
        } else {
          tasks[index] = task;
        }
        return { ...state, tasks, saving: false };
      }
      case SAVE_TASK_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      case REMOVE_TASK_STARTED:
        return { ...state, savingError: null, saving: true };
      case REMOVE_TASK_SUCCEEDED:
        return { ...state, tasks: state.tasks?.filter(t => getTaskId(t) !== payload.id), saving: false };
      case REMOVE_TASK_FAILED:
        return { ...state, savingError: payload.error, saving: false };
      default:
        return state;
    }
  };

export const TaskContext = React.createContext<TasksState>(initialState);

interface TaskProviderProps {
  children?: React.ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tasks, fetching, fetchingError, saving, savingError, currentOffset, totalCount, hasMore, pageSize } = state;
  const { isOnline } = useServerStatus(4000);
  const currentOffsetRef = useRef(currentOffset);

  useEffect(() => {
    currentOffsetRef.current = currentOffset;
  }, [currentOffset]);

  useEffect(() => {
    const cached = loadCachedTasks();
    if (cached.tasks.length) {
      dispatch({
        type: FETCH_TASKS_SUCCEEDED,
        payload: { tasks: cached.tasks, offset: cached.offset, total: cached.total },
      });
    }
  }, []);

  useEffect(() => {
    if (tasks) {
      saveCachedTasks({ tasks, offset: currentOffset, total: totalCount });
    }
  }, [tasks, currentOffset, totalCount]);

  const requestPage = useCallback(async (offset = 0, signal?: AbortSignal) => {
    try {
      dispatch({ type: FETCH_TASKS_STARTED, payload: { offset } });
      const response = await getItems({ limit: PAGE_SIZE, offset, signal });
      const normalized = {
        items: response.items ?? [],
        offset: typeof response.offset === 'number' ? response.offset : offset,
        total: response.total,
        limit: response.limit ?? PAGE_SIZE,
      };
      dispatch({
        type: FETCH_TASKS_SUCCEEDED,
        payload: {
          tasks: normalized.items,
          offset: normalized.offset,
          total: normalized.total,
          limit: normalized.limit,
        },
      });
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') {
        return;
      }
      log('requestPage failed', error);
      const cached = loadCachedTasks();
      if (cached.tasks.length && cached.offset === offset) {
        dispatch({
          type: FETCH_TASKS_SUCCEEDED,
          payload: { tasks: cached.tasks, offset: cached.offset, total: cached.total },
        });
        return;
      }
      dispatch({ type: FETCH_TASKS_FAILED, payload: { error } });
    }
  }, []);

  useEffect(getTasksEffect, [requestPage]);
  useEffect(wsEffect, [requestPage]);
  useEffect(syncPendingOperationsEffect, [isOnline, requestPage]);

  const loadNextPage = useCallback(() => {
    if (fetching || !hasMore) {
      return;
    }
    requestPage(currentOffset + pageSize);
  }, [fetching, hasMore, currentOffset, pageSize, requestPage]);

  const loadPreviousPage = useCallback(() => {
    if (fetching || currentOffset === 0) {
      return;
    }
    requestPage(Math.max(0, currentOffset - pageSize));
  }, [fetching, currentOffset, pageSize, requestPage]);

  const addTask = useCallback((task: TaskProps) => {
    (async () => {
      const timestamp = Date.now();
      // const draftTask = { text: `New task ${timestamp}`, description: 'Task description' };
      try {
        log('addTask started');
        dispatch({ type: SAVE_TASK_STARTED });
        // create with a default description for new tasks
        const newTask = await addItem(task);
        dispatch({ type: SAVE_TASK_SUCCEEDED, payload: { task: newTask } });
        requestPage(currentOffsetRef.current);
      } catch (error) {
        log('addTask failed', error);
        const localTask: TaskProps = {
          _id: `local-${timestamp}`,
          ...task,
          pendingAction: 'create',
          isLocalOnly: true,
        };
        dispatch({ type: SAVE_TASK_SUCCEEDED, payload: { task: localTask } });
        enqueuePendingOperation({ type: 'create', task: localTask });
        dispatch({ type: SAVE_TASK_FAILED, payload: { error } });
      }
    })();
  }, [requestPage]);

  const updateTask = useCallback((task: TaskProps) => {
    (async () => {
      try {
        log('updateTask started');
        dispatch({ type: SAVE_TASK_STARTED });
        const saved = await updateItem(task);
        dispatch({ type: SAVE_TASK_SUCCEEDED, payload: { task: saved } });
        requestPage(currentOffsetRef.current);
      } catch (error) {
        log('updateTask failed', error);
        const localTask: TaskProps = {
          ...task,
          pendingAction: 'update',
          isLocalOnly: !task._id,
        };
        dispatch({ type: SAVE_TASK_SUCCEEDED, payload: { task: localTask } });
        enqueuePendingOperation({ type: 'update', task: localTask });
        dispatch({ type: SAVE_TASK_FAILED, payload: { error } });
      }
    })();
  }, [requestPage]);

  const removeTask = useCallback((id?: string) => {
    if (!id) return;
    (async () => {
      try {
        log('removeTask started');
        dispatch({ type: REMOVE_TASK_STARTED });
        await removeItem(id);
        dispatch({ type: REMOVE_TASK_SUCCEEDED, payload: { id } });
        requestPage(currentOffsetRef.current);
      } catch (error) {
        log('removeTask failed', error);
        dispatch({ type: REMOVE_TASK_SUCCEEDED, payload: { id } });
        enqueuePendingOperation({ type: 'delete', id });
        dispatch({ type: REMOVE_TASK_FAILED, payload: { error } });
      }
    })();
  }, [requestPage]);

  const value = {
    tasks,
    fetching,
    fetchingError,
    saving,
    savingError,
    addTask,
    updateTask,
    removeTask,
    loadNextPage,
    loadPreviousPage,
    pageSize,
    currentOffset,
    totalCount,
    hasMore,
  };
  log('returns');
  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );

  function getTasksEffect() {
    const controller = new AbortController();
    requestPage(0, controller.signal);
    return () => {
      try { controller.abort(); } catch (e) { /* noop */ }
    };
  }

  function syncPendingOperationsEffect() {
    if (!isOnline) {
      return;
    }
    let canceled = false;
    (async () => {
      const pending = loadPendingOperations();
      if (!pending.length) {
        return;
      }
      let remaining = [...pending];
      for (const operation of pending) {
        if (canceled) {
          break;
        }
        try {
          await executePendingOperation(operation);
          remaining = remaining.slice(1);
          savePendingOperations(remaining);
        } catch (error) {
          log('syncPendingOperationsEffect - operation failed', error);
          break;
        }
      }
      if (remaining.length !== pending.length && !canceled) {
        try {
          await requestPage(currentOffsetRef.current);
        } catch (error) {
          log('syncPendingOperationsEffect - refresh failed', error);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }

  async function executePendingOperation(operation: PendingOperation) {
    switch (operation.type) {
      case 'create':
        await addItem({ text: operation.task.text, description: operation.task.description });
        return;
      case 'update': {
        const id = operation.task._id;
        if (!id || id.startsWith('local-')) {
          await addItem({ text: operation.task.text, description: operation.task.description });
        } else {
          await updateItem(operation.task);
        }
        return;
      }
      case 'delete':
        if (!operation.id || operation.id.startsWith('local-')) {
          return;
        }
        await removeItem(operation.id);
        return;
      default:
        return;
    }
  }

  function wsEffect() {
    let canceled = false;
    log('wsEffect - connecting');
    const closeWebSocket = newWebSocket(message => {
      if (canceled) {
        return;
      }
      const { event, payload: { item } } = message as any;
      log(`ws message, item ${event}`);
      if (event === 'created' || event === 'updated' || event === 'deleted') {
        requestPage(currentOffsetRef.current);
      }
    });
    return () => {
      log('wsEffect - disconnecting');
      canceled = true;
      closeWebSocket();
    };
  }
};

export default TaskProvider;
