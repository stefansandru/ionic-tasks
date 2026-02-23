import axios from 'axios';
import { getLogger } from '../core';
import { API_BASE_URL } from '../core/apiConfig';
import { TaskProps } from './TaskProps';

const log = getLogger('itemApi');

// teacher server exposes API under /api
const baseUrl = API_BASE_URL;

export interface PaginatedTasksResponse {
  items: TaskProps[];
  total?: number;
  offset?: number;
  limit?: number;
}

interface GetItemsParams {
  signal?: AbortSignal;
  limit?: number;
  offset?: number;
}

export const getItems = ({ signal, limit, offset }: GetItemsParams = {}): Promise<PaginatedTasksResponse> => {
  log('getItems - started');
  const params: Record<string, number> = {};
  if (typeof limit === 'number') {
    params.limit = limit;
  }
  if (typeof offset === 'number') {
    params.offset = offset;
  }
  return axios
    .get<PaginatedTasksResponse | TaskProps[]>(`${baseUrl}/item`, { params, signal })
    .then((res: { data: PaginatedTasksResponse | TaskProps[] }) => {
      log('getItems - succeeded');
      if (Array.isArray(res.data)) {
        const safeTotal = res.data.length;
        const safeLimit = typeof limit === 'number' ? limit : safeTotal;
        const safeOffset = typeof offset === 'number' ? offset : 0;
        const items = res.data.slice(safeOffset, safeOffset + safeLimit);
        return Promise.resolve({
          items,
          total: safeTotal,
          offset: safeOffset,
          limit: safeLimit,
        });
      }
      return Promise.resolve(res.data);
    })
    .catch((err: any) => {
      log('getItems - failed', err);
      return Promise.reject(err);
    });
};

export const addItem: (item: { text: string; description?: string }) => Promise<TaskProps> = (item) => {
  log('addItem - started', item);
  return axios
    .post<TaskProps>(`${baseUrl}/item`, item)
    .then((res: { data: TaskProps }) => {
      log('addItem - succeeded');
      return Promise.resolve(res.data);
    })
    .catch((err: any) => {
      log('addItem - failed', err);
      return Promise.reject(err);
    });
};

export const removeItem: (_id?: string) => Promise<void> = (_id) => {
  log('removeItem - started', _id);
  return axios
    .delete(`${baseUrl}/item/${_id}`)
    .then(() => {
      log('removeItem - succeeded');
      return Promise.resolve();
    })
    .catch((err: any) => {
      log('removeItem - failed', err);
      return Promise.reject(err);
    });
};

export default getItems;

interface MessageData {
  event: string;
  payload: {
    item: TaskProps;
  };
}

export const newWebSocket = (onMessage: (data: MessageData) => void) => {
  const ws = new WebSocket(`ws://localhost:3000`);
  ws.onopen = () => {
    // send initial authorization message expected by teacher server
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
      }
    } catch (e) {
      // ignore (e.g., running in environments without localStorage)
    }
    log('web socket onopen');
  };
  ws.onclose = () => {
    log('web socket onclose');
  };
  ws.onerror = error => {
    log('web socket onerror', error);
  };
  ws.onmessage = messageEvent => {
    log('web socket onmessage');
    try {
      onMessage(JSON.parse(messageEvent.data));
    } catch (e) {
      log('web socket message parse error', e);
    }
  };
  return () => {
    try { ws.close(); } catch (e) { /* noop */ }
  };
}

export const updateItem: (item: TaskProps) => Promise<TaskProps> = (item) => {
  log('updateItem - started', item);
  return axios
    .put<TaskProps>(`${baseUrl}/item/${item._id}`, item)
    .then((res: { data: TaskProps }) => {
      log('updateItem - succeeded');
      return Promise.resolve(res.data);
    })
    .catch((err: any) => {
      log('updateItem - failed', err);
      return Promise.reject(err);
    });
};
