import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function authHeaders() {
  const token = await getToken();
  return token ? { 'x-auth-token': token } : {};
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Errore server (${res.status})`);
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function register(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// ─── AI Coach ────────────────────────────────────────────────────────────────

/**
 * Invia i frame estratti (base64) al server per l'analisi AI.
 * Sul mobile non inviamo il file video completo — solo i frame.
 */
export async function analyzeFrames(framesBase64 = [], spotName = '', lang = 'it') {
  const headers = await authHeaders();

  const formData = new FormData();
  formData.append('frames', JSON.stringify(framesBase64));
  if (spotName) formData.append('spot', spotName);
  formData.append('lang', lang);

  const res = await fetch(`${BASE_URL}/api/coach/analyze`, {
    method: 'POST',
    headers, // multer legge multipart senza Content-Type esplicito
    body: formData,
  });
  return handleResponse(res);
}

export async function getStats() {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/coach/stats`, { headers });
  return handleResponse(res);
}

export async function getHistory() {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/coach/history`, { headers });
  return handleResponse(res);
}

export async function getProgress() {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/coach/progress`, { headers });
  return handleResponse(res);
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function createCheckoutSession(plan = 'premium') {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}/api/payment/create-checkout-session`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  return handleResponse(res);
}

export async function verifyPaymentSession(sessionId) {
  const headers = await authHeaders();
  const res = await fetch(
    `${BASE_URL}/api/payment/verify-session?session_id=${sessionId}`,
    { headers }
  );
  return handleResponse(res);
}

// ─── Local Storage helpers ────────────────────────────────────────────────────

export async function saveUser(user, token) {
  await AsyncStorage.setItem('user', JSON.stringify(user));
  if (token) await AsyncStorage.setItem('token', token);
}

export async function loadUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['user', 'token']);
}
