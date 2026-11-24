const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[]; meta?: any }> {
  const token = localStorage.getItem('wms_auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('wms_auth_token');
    localStorage.removeItem('wms_auth_user');
    window.location.href = '/login';
  }

  // Handle file/blob download
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    const text = await response.text();
    return { success: true, data: text as any };
  }

  // Handle responses that are not JSON (e.g. HTML 404, 502 Bad Gateway while backend is deploying)
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (response.status === 404) {
      throw new Error('API endpoint not found (HTTP 404). Backend deployment may still be updating.');
    }
    if (response.status === 502 || response.status === 503) {
      throw new Error('Backend server is waking up or temporarily unavailable. Please retry in 10-15 seconds.');
    }
    throw new Error(
      text && text.length < 120 && !text.includes('<!DOCTYPE')
        ? text
        : `Server returned unexpected response (HTTP ${response.status}).`
    );
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Request failed with status ' + response.status);
  }

  return json;
}
