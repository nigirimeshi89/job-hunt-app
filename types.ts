// src/types.ts

export type Company = {
  id: number;
  name: string;
  status: string;
  nextDate: string;
  nextTime?: string;
  nextEndTime?: string;
  event_content?: string;
  event_requirements?: string;
  mypage_url?: string;
  login_id?: string;
  login_password?: string;
  memo?: string;
  priority: string;
  industry?: string;
  contact_email?: string;
};

export type Notification = {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  company_id?: number;
  email_body?: string; // 👈 追加：メール本文
};

export const STATUS_OPTIONS = [
  "未エントリー", "書類選考中", "1次面接", "2次面接", "最終面接", "内定", "お見送り",
];

export const PRIORITY_OPTIONS = ["高", "中", "低"];