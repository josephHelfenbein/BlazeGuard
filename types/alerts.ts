export type Alert = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  predictedTime: Date;
  severity: "low" | "medium" | "high";
  isRead: boolean;
  location: string;
};
