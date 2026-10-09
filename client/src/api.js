const TOKEN_KEY = "draftroom_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong.");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login: (b) => request("/auth/login", { method: "POST", body: b }),
  list: (q = "") => request(`/content?q=${encodeURIComponent(q)}`),
  generate: (b) => request("/content/generate", { method: "POST", body: b }),
  transform: (id, b) => request(`/content/${id}/transform`, { method: "POST", body: b }),
  save: (id, b) => request(`/content/${id}`, { method: "PUT", body: b }),
  remove: (id) => request(`/content/${id}`, { method: "DELETE" }),
};
