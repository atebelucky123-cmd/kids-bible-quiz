// The admin dashboard relies solely on the httpOnly session cookie set by
// POST /api/auth/login (see server/src/controllers/auth.controller.ts) —
// unlike the mobile app, a browser can depend on cookies working
// consistently, so there's no token to store or attach here.
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export class ApiError extends Error {
  code: string;
  details?: { path: string; message: string }[];

  constructor(message: string, code: string, details?: { path: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError('VITE_API_URL is not set — check admin/.env.', 'CONFIG_ERROR');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the API. Is the server running?', 'NETWORK_ERROR');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const err = body?.error ?? { message: 'Something went wrong', code: 'UNKNOWN_ERROR' };
    throw new ApiError(err.message, err.code, err.details);
  }

  return body as T;
}

export type AdminUser = {
  id: number;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ADMIN';
};

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export type Question = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerOption;
  ageMin: number;
  ageMax: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QuestionInput = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerOption;
  ageMin: number;
  ageMax: number;
  isActive?: boolean;
};

export type Student = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  age: number;
  joinedAt: string;
  attemptCount: number;
  lastResult: { percentage: number; completedAt: string } | null;
};

export type Attempt = {
  id: number;
  student: { id: number; firstName: string; lastName: string; age: number };
  status: 'IN_PROGRESS' | 'FINISHED';
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
  percentage: number | null;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number;
  secondsRemaining: number | null;
};

export type Overview = {
  counts: {
    students: number;
    questions: number;
    activeQuestions: number;
    attempts: number;
    completedAttempts: number;
  };
  completionRate: number;
  ageBandBreakdown: { band: string; attempts: number }[];
};

export const api = {
  async login(input: { firstName: string; password: string }) {
    const data = await request<{ user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.user;
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST' });
  },

  async me() {
    const data = await request<{ user: AdminUser }>('/api/auth/me');
    return data.user;
  },

  async getOverview() {
    return request<Overview>('/api/admin/overview');
  },

  async listQuestions() {
    return request<Question[]>('/api/admin/questions');
  },

  async createQuestion(input: QuestionInput) {
    return request<Question>('/api/admin/questions', { method: 'POST', body: JSON.stringify(input) });
  },

  async updateQuestion(id: number, input: Partial<QuestionInput>) {
    return request<Question>(`/api/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },

  async deleteQuestion(id: number) {
    return request<void>(`/api/admin/questions/${id}`, { method: 'DELETE' });
  },

  async listStudents() {
    return request<Student[]>('/api/admin/students');
  },

  async listAttempts(filters: { status?: 'IN_PROGRESS' | 'FINISHED'; search?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return request<Attempt[]>(`/api/admin/attempts${qs ? `?${qs}` : ''}`);
  },

  async changePassword(input: { currentPassword: string; newPassword: string }) {
    return request<void>('/api/admin/me/password', { method: 'PATCH', body: JSON.stringify(input) });
  },
};
