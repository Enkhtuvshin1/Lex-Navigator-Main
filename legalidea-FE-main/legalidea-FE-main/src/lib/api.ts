const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("admin_access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ────────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  bar_number: string | null;
  specialization: string | null;
  law_firm: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  email: string;
  password: string;
  full_name?: string;
  role?: "user" | "lawyer";
  bar_number?: string | null;
  specialization?: string | null;
  law_firm?: string | null;
}) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Admin

export interface AdminAuthResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export function adminLogin(username: string, password: string) {
  return request<AdminAuthResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getAdminUsers() {
  return adminRequest<UserPublic[]>("/api/admin/users");
}

export function updateAdminUser(
  userId: string,
  data: {
    email?: string;
    full_name?: string | null;
    role?: "user" | "lawyer";
    is_active?: boolean;
    bar_number?: string | null;
    specialization?: string | null;
    law_firm?: string | null;
  },
) {
  return adminRequest<UserPublic>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export interface CaseAdminItem {
  id: string;
  user_id: string;
  title: string | null;
  status: string;
  created_at: string;
}

export function getAdminCases() {
  return adminRequest<CaseAdminItem[]>("/api/admin/cases");
}

export function deleteAdminCase(caseId: string) {
  return adminRequest<void>(`/api/admin/cases/${caseId}`, { method: "DELETE" });
}

export interface LawCategoryCreate {
  name: string;
  description?: string | null;
}

export interface LawArticleCreate {
  category_id: number;
  number: string;
  title: string;
  content: string;
}

export interface LawArticleUpdate {
  number: string;
  title: string;
  content: string;
}

export function adminGetLawCategories() {
  return adminRequest<LawCategory[]>("/api/admin/law/categories");
}

export function adminCreateLawCategory(data: LawCategoryCreate) {
  return adminRequest<LawCategory>("/api/admin/law/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function adminDeleteLawCategory(categoryId: number) {
  return adminRequest<void>(`/api/admin/law/categories/${categoryId}`, { method: "DELETE" });
}

export function adminCreateLawArticle(data: LawArticleCreate) {
  return adminRequest<LawArticleFull>("/api/admin/law/articles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function adminUpdateLawArticle(articleId: number, data: LawArticleUpdate) {
  return adminRequest<LawArticleFull>(`/api/admin/law/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function adminDeleteLawArticle(articleId: number) {
  return adminRequest<void>(`/api/admin/law/articles/${articleId}`, { method: "DELETE" });
}

export function adminGetCategoryArticles(categoryId: number) {
  return adminRequest<LawArticleSummary[]>(`/api/admin/law/categories/${categoryId}/articles`);
}

// ── Profile ─────────────────────────────────────────────────────────────

export function getProfile() {
  return request<UserPublic>("/api/profile/me");
}

export function updateProfile(data: {
  full_name?: string | null;
  bar_number?: string | null;
  specialization?: string | null;
  law_firm?: string | null;
}) {
  return request<UserPublic>("/api/profile/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Chat ────────────────────────────────────────────────────────────────

export interface CasePublic {
  id: string;
  user_id: string;
  title: string | null;
  status: string;
  created_at: string;
}

export interface LawRef {
  id: number;
  number: string;
  title: string;
}

export interface MessagePublic {
  id: string;
  case_id: string;
  role: "user" | "assistant";
  content: string;
  law_references: LawRef[];
  created_at: string;
}

export function getChatHistory() {
  return request<CasePublic[]>("/api/chat/history");
}

export function createCase(title?: string) {
  return request<CasePublic>("/api/chat/cases", {
    method: "POST",
    body: JSON.stringify({ title: title ?? null }),
  });
}

export function getCaseMessages(caseId: string) {
  return request<MessagePublic[]>(`/api/chat/cases/${caseId}/messages`);
}

export function deleteCase(caseId: string) {
  return request<void>(`/api/chat/cases/${caseId}`, { method: "DELETE" });
}

export function renameCase(caseId: string, title: string) {
  return request<CasePublic>(`/api/chat/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function sendMessage(caseId: string, content: string) {
  return request<MessagePublic>("/api/chat/message", {
    method: "POST",
    body: JSON.stringify({ case_id: caseId, content }),
  });
}

export function getSuggestions(userMessage: string, aiAnswer: string) {
  return request<{ questions: string[] }>("/api/chat/suggest", {
    method: "POST",
    body: JSON.stringify({ user_message: userMessage, ai_answer: aiAnswer }),
  });
}

// ── Law ─────────────────────────────────────────────────────────────────

export interface LawCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface LawArticleSummary {
  id: number;
  category_id: number;
  number: string;
  title: string;
}

export interface LawArticleFull {
  id: number;
  category_id: number;
  number: string;
  title: string;
  content: string;
  created_at: string;
}

export function getLawCategories() {
  return request<LawCategory[]>("/api/law/categories");
}

export function getCategoryArticles(categoryId: number) {
  return request<LawArticleSummary[]>(`/api/law/categories/${categoryId}/articles`);
}

export function getArticle(articleId: number) {
  return request<LawArticleFull>(`/api/law/articles/${articleId}`);
}

export function searchLaw(query: string) {
  return request<LawArticleSummary[]>(`/api/law/search?query=${encodeURIComponent(query)}`);
}
