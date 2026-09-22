export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
  is_active: boolean;
  created_at: string;
}

export interface MonitorCreate {
  name: string;
  url: string;
  interval_seconds?: number;
  timeout_seconds?: number;
  expected_status_code?: number;
  is_active?: boolean;
}

export interface PingLog {
  id: number;
  monitor_id: string;
  status_code: number | null;
  response_time_ms: number;
  is_up: boolean;
  error_message: string | null;
  created_at: string;
}

export interface UptimeStats {
  monitor_id: string;
  window_days: number;
  total_checks: number;
  successful_checks: number;
  uptime_percent: number;
  avg_latency_ms: number;
}
