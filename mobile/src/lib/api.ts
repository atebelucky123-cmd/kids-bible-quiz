import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = 'session_token';

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

// expo-secure-store has no web implementation (it's backed by the iOS
// Keychain / Android Keystore, which don't exist on web). The real target
// platform is iOS, where SecureStore is used properly; localStorage is
// just a fallback so the web preview (used for fast local iteration)
// doesn't crash outright.
export async function getToken() {
  if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function clearToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      'The app is not configured with an API address (EXPO_PUBLIC_API_URL). Check mobile/.env.',
      'CONFIG_ERROR'
    );
  }

  const token = await getToken();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "We lost the internet — your quiz is saved. Ask a grown-up to check the connection, then try again.",
      'NETWORK_ERROR'
    );
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

export type PublicUser = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  age: number;
  hobbies: string | null;
  favoriteColor: string | null;
  favoriteAnimal: string | null;
  role: 'STUDENT' | 'ADMIN';
};

export type RegisterInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  hobbies: string;
  favoriteColor: string;
  favoriteAnimal: string;
  password: string;
};

export type LoginInput = { firstName: string; password: string };

export type QuizAttemptSummary = {
  id: number;
  status: 'IN_PROGRESS' | 'FINISHED';
  score: number;
  totalQuestions: number;
  percentage: number | null;
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
};

export type AttemptsSummary = {
  attempts: QuizAttemptSummary[];
  // secondsRemaining reflects whether the in-progress attempt's current
  // question can still be answered — Continue Quiz is a dead end once it
  // hits 0, since there's no way to submit an answer to an expired question.
  inProgressAttempt: (QuizAttemptSummary & { secondsRemaining: number }) | null;
  stats: {
    quizzesCompleted: number;
    starsEarned: number;
    lastResult: QuizAttemptSummary | null;
  };
};

export type PublicQuestion = {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export type QuizAttemptState = {
  attemptId: number;
  status: 'IN_PROGRESS' | 'FINISHED';
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLimitSeconds: number;
};

export type CurrentQuestionResponse = QuizAttemptState & {
  secondsRemaining: number;
  question: PublicQuestion;
};

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export type AnswerResult = {
  correct: boolean;
  message: string;
  attempt: QuizAttemptState;
  isQuizComplete: boolean;
  score: number;
  secondsRemaining: number | null;
};

export const api = {
  async register(input: RegisterInput) {
    const data = await request<{ user: PublicUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await setToken(data.token);
    return data.user;
  },

  async login(input: LoginInput) {
    const data = await request<{ user: PublicUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await setToken(data.token);
    return data.user;
  },

  async logout() {
    await request('/api/auth/logout', { method: 'POST' }).catch(() => {
      // Even if the network call fails, clear the local token so the app
      // treats the user as logged out.
    });
    await clearToken();
  },

  async me() {
    const data = await request<{ user: PublicUser }>('/api/auth/me');
    return data.user;
  },

  async getAttemptsSummary() {
    return request<AttemptsSummary>('/api/me/attempts');
  },

  async startQuiz(restart = false) {
    return request<QuizAttemptState>('/api/quiz/start', {
      method: 'POST',
      body: JSON.stringify({ restart }),
    });
  },

  async getQuizQuestion(attemptId: number) {
    return request<CurrentQuestionResponse>(`/api/quiz/${attemptId}`);
  },

  async submitAnswer(attemptId: number, selectedOption: AnswerOption) {
    return request<AnswerResult>(`/api/quiz/${attemptId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ selectedOption }),
    });
  },
};
