import { TaskProps } from './TaskProps';

const TASKS_CACHE_KEY = 'task_cache';
const PENDING_OPS_KEY = 'task_pending_operations';

export type PendingOperation =
  | { type: 'create'; task: TaskProps }
  | { type: 'update'; task: TaskProps }
  | { type: 'delete'; id: string };

export interface CachedTasksPayload {
  tasks: TaskProps[];
  offset: number;
  total?: number;
}

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const readFromStorage = <T>(key: string, fallback: T): T => {
  if (!hasStorage()) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage`, error);
    return fallback;
  }
};

const writeToStorage = <T>(key: string, value: T) => {
  if (!hasStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage`, error);
  }
};

const defaultCachedTasks: CachedTasksPayload = { tasks: [], offset: 0 };

export const loadCachedTasks = (): CachedTasksPayload => {
  const cached = readFromStorage<any>(TASKS_CACHE_KEY, defaultCachedTasks);
  if (Array.isArray(cached)) {
    return { tasks: cached, offset: 0 };
  }
  return {
    ...defaultCachedTasks,
    ...cached,
    tasks: Array.isArray(cached?.tasks) ? cached.tasks : [],
    offset: typeof cached?.offset === 'number' ? cached.offset : 0,
    total: typeof cached?.total === 'number' ? cached.total : undefined,
  };
};

export const saveCachedTasks = (payload: CachedTasksPayload = defaultCachedTasks) =>
  writeToStorage(TASKS_CACHE_KEY, payload);

export const loadPendingOperations = (): PendingOperation[] =>
  readFromStorage<PendingOperation[]>(PENDING_OPS_KEY, []);

export const savePendingOperations = (operations: PendingOperation[] = []) =>
  writeToStorage(PENDING_OPS_KEY, operations);

export const enqueuePendingOperation = (operation: PendingOperation) => {
  const operations = loadPendingOperations();
  operations.push(operation);
  savePendingOperations(operations);
};

