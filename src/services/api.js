const BASE = process.env.REACT_APP_API_URL ||"http://localhost:8080/api";

const getHeaders = (sendAuth = true) => ({
  "Content-Type": "application/json",
  ...(sendAuth && {
    ...(localStorage.getItem("adminToken")
      ? { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
      : localStorage.getItem("token")
      ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
      : {})
  })
});

// Auth
export const login = (username, password) =>
  fetch(`${BASE}/auth/login`, { method:"POST", headers:getHeaders(), body:JSON.stringify({username,password}) }).then(r=>r.json());

export const register = (username, email, password) =>
  fetch(`${BASE}/auth/register`, { method:"POST", headers:getHeaders(), body:JSON.stringify({username,email,password}) }).then(r=>r.json());

export const adminLogin = (username, password) => {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  return fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({username, password})
  }).then(r => r.json());
};

// Questions
export const getQuestions = (params={}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null&&v!=="All"));
  return fetch(`${BASE}/questions?${qs}`, { headers:getHeaders() }).then(r=>r.json());
};

export const getTopics = (subject) =>
  fetch(`${BASE}/questions/topics${subject?`?subject=${subject}`:""}`, { headers:getHeaders() }).then(r=>r.json());

// Test
export const submitTest = (data) =>
  fetch(`${BASE}/test/submit`, { method:"POST", headers:getHeaders(), body:JSON.stringify(data) }).then(r=>r.json());

export const getTestHistory = (userId) =>
  fetch(`${BASE}/test/history?userId=${userId}`, { headers:getHeaders() }).then(r=>r.json());

// AI
export const getAIExplain = (questionId) =>
  fetch(`${BASE}/ai/explain`, { method:"POST", headers:getHeaders(), body:JSON.stringify({questionId,type:"explain"}) }).then(r=>r.json());

export const getAIHint = (questionId) =>
  fetch(`${BASE}/ai/hint`, { method:"POST", headers:getHeaders(), body:JSON.stringify({questionId,type:"hint"}) }).then(r=>r.json());

export const getAISimilar = (questionId) =>
  fetch(`${BASE}/ai/similar`, { method:"POST", headers:getHeaders(), body:JSON.stringify({questionId,type:"similar"}) }).then(r=>r.json());

// Bookmarks
export const getBookmarks = (userId) =>
  fetch(`${BASE}/bookmarks?userId=${userId}`, { headers:getHeaders() }).then(r=>r.json());

export const addBookmark = (userId, questionId) =>
  fetch(`${BASE}/bookmarks`, { method:"POST", headers:getHeaders(), body:JSON.stringify({userId,questionId}) }).then(r=>r.json());

export const removeBookmark = (userId, questionId) =>
  fetch(`${BASE}/bookmarks/${questionId}?userId=${userId}`, { method:"DELETE", headers:getHeaders() }).then(r=>r.json());

// Admin
export const adminAddQuestion = (data) =>
  fetch(`${BASE}/admin/questions`, { method:"POST", headers:getHeaders(), body:JSON.stringify(data) }).then(r=>r.json());

export const adminUpdateQuestion = (id, data) =>
  fetch(`${BASE}/admin/questions/${id}`, { method:"PUT", headers:getHeaders(), body:JSON.stringify(data) }).then(r=>r.json());

export const adminDeleteQuestion = (id) =>
  fetch(`${BASE}/admin/questions/${id}`, { method:"DELETE", headers:getHeaders() }).then(r=>r.json());

export const adminBulkImport = (questions) =>
  fetch(`${BASE}/admin/questions/bulk`, { method:"POST", headers:getHeaders(), body:JSON.stringify(questions) }).then(r=>r.json());

export const adminGetStats = () =>
  fetch(`${BASE}/admin/stats`, { headers:getHeaders() }).then(r=>r.json());

export const extractPDF = (base64, mimeType, prompt) =>
  fetch(`${BASE}/admin/extract-pdf`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ base64, mimeType, prompt })
  }).then(r => r.json());

  // Reports
export const reportQuestion = (questionId, userId, username, reason, note) =>
  fetch(`${BASE}/reports`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ questionId, userId, username, reason, note })
  }).then(r => r.json());

export const getReports = () =>
  fetch(`${BASE}/admin/reports`, { headers: getHeaders() }).then(r => r.json());

export const resolveReport = (reportId, action) =>
  fetch(`${BASE}/admin/reports/${reportId}/resolve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ action })
  }).then(r => r.json());

export const submitBugReport = async (userId, username, description, category, pageUrl) => {
  const res = await fetch(`${BASE}/bug-reports`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ userId, username, description, category, pageUrl }),
  });
  return res.json();
};

export const getBugReports = async () => {
  const res = await fetch(`${BASE}/admin/bug-reports`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const resolveBugReport = async (id) => {
  const res = await fetch(`${BASE}/admin/bug-reports/${id}/resolve`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};