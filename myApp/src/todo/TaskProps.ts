export interface TaskProps {
  _id?: string;
  text: string;
  description?: string;
  amount?: number;
  date?: string;
  isCompleted?: boolean;
  pendingAction?: 'create' | 'update' | 'delete';
  isLocalOnly?: boolean;
  photo?: string;
  lat?: number;
  lng?: number;
}
