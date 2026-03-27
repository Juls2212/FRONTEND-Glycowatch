export type AlertItem = {
  id: number;
  type: "HIGH_GLUCOSE" | "LOW_GLUCOSE";
  message: string;
  isRead: boolean;
  readAt: string | null;
  measurementId: number;
  createdAt: string;
};

