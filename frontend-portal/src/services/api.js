const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('aboccrim_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 && token) {
    // Token expired or invalid
    localStorage.removeItem('aboccrim_token');
    localStorage.removeItem('aboccrim_refresh');
    localStorage.removeItem('aboccrim_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const error = new Error(data?.error || data?.detail || 'Error en la solicitud');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authService = {
  login: (email, password) =>
    apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (payload) =>
    apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: (refresh) =>
    apiRequest('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh })
    }),

  getProfile: () => apiRequest('/auth/me/'),
};

export const userService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users/${query ? `?${query}` : ''}`);
  },

  get: (id) => apiRequest(`/users/${id}/`),

  create: (data) =>
    apiRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiRequest(`/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  assignRoles: (id, roles_codigos) =>
    apiRequest(`/users/${id}/assign_roles/`, {
      method: 'POST',
      body: JSON.stringify({ roles_codigos })
    }),
};

export const roleService = {
  list: () => apiRequest('/roles/'),

  get: (id) => apiRequest(`/roles/${id}/`),

  create: (data) =>
    apiRequest('/roles/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  assignPermissions: (id, permisos_codigos) =>
    apiRequest(`/roles/${id}/permissions/`, {
      method: 'POST',
      body: JSON.stringify({ permisos_codigos })
    }),

  listPermissions: () => apiRequest('/permissions/'),
};

export const auditService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/audit/${query ? `?${query}` : ''}`);
  },
};

export const academicProfileService = {
  getMine: () => apiRequest('/academic/profile/me/'),

  saveMine: (profile) =>
    apiRequest('/academic/profile/me/', {
      method: 'PUT',
      body: JSON.stringify(profile)
    }),

  requestInvestigatorDirectory: () =>
    apiRequest('/academic/profile/me/request-investigator/', { method: 'POST' }),
};

export const investigatorService = {
  get: (id) => apiRequest(`/academic/investigators/${id}/`),

  publicList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/academic/public/investigators/${query ? `?${query}` : ''}`);
  },

  publicDetail: (id) => apiRequest(`/academic/public/investigators/${id}/`),

  publicAreas: () => apiRequest('/academic/public/areas/'),

  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/academic/investigators/${query ? `?${query}` : ''}`);
  },

  availableProfiles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/academic/investigators/available-profiles/${query ? `?${query}` : ''}`);
  },

  create: (data) => apiRequest('/academic/investigators/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/academic/investigators/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  listAreas: () => apiRequest('/academic/areas/'),

  createArea: (data) => apiRequest('/academic/areas/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateArea: (id, data) => apiRequest(`/academic/areas/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
};

export const memberService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/academic/members/${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/academic/members/${id}/`),
  create: (data) => apiRequest('/academic/members/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/academic/members/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  availableUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/academic/members/available-users/${query ? `?${query}` : ''}`);
  },
  listCategories: () => apiRequest('/academic/member-categories/'),
  createCategory: (data) => apiRequest('/academic/member-categories/', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/academic/member-categories/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/academic/member-categories/${id}/`, { method: 'DELETE' }),
};
