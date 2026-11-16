const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const { skipAuth = false, ...fetchOptions } = options;
  const token = localStorage.getItem('aboccrim_token');

  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers
  });

  if (response.status === 401 && token && !skipAuth) {
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

  confirmEmail: (token) =>
    apiRequest('/auth/confirm-email/', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),

  resendConfirmation: (email) =>
    apiRequest('/auth/resend-confirmation/', {
      method: 'POST',
      body: JSON.stringify({ email })
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

export const publicationService = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/publications/${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/publications/${id}/`),
  create: (data) => {
    const isFormData = data instanceof FormData;
    return apiRequest('/publications/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    });
  },
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    return apiRequest(`/publications/${id}/`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data)
    });
  },

  // Clasificación y Catálogos Académicos
  listTypes: () => apiRequest('/publications/types/'),
  listDocTypes: () => apiRequest('/publications/document-types/'),
  listCategories: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/publications/categories/${query ? `?${query}` : ''}`);
  },
  createCategory: (data) => apiRequest('/publications/categories/', { method: 'POST', body: JSON.stringify(data) }),
  listKeywords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/publications/keywords/${query ? `?${query}` : ''}`);
  },
  listAvailableInvestigators: () => apiRequest('/publications/investigators/'),

  // Documentos Digitales y Descarga
  listDocuments: (pubId) => apiRequest(`/publications/${pubId}/documents/`),
  uploadDocument: (pubId, formData) => apiRequest(`/publications/${pubId}/documents/`, {
    method: 'POST',
    body: formData
  }),
  getDocument: (docId) => apiRequest(`/publications/documents/${docId}/`),
  updateDocument: (docId, data) => apiRequest(`/publications/documents/${docId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  replaceDocument: (docId, formData) => apiRequest(`/publications/documents/${docId}/replace/`, {
    method: 'POST',
    body: formData
  }),
  deleteDocument: (docId) => apiRequest(`/publications/documents/${docId}/`, {
    method: 'DELETE'
  }),
  downloadDocumentBlob: async (docId, filename = 'documento.pdf') => {
    const token = localStorage.getItem('aboccrim_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/publications/documents/${docId}/download/`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al descargar el documento.');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  previewDocumentBlob: async (docId) => {
    const token = localStorage.getItem('aboccrim_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/publications/documents/${docId}/download/?inline=1`, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al abrir el documento.');
    }
    const blob = await response.blob();
    const fileUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    window.open(fileUrl, '_blank');
  },

  // Revisión Académica
  listReviewQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/publications/review-queue/${query ? `?${query}` : ''}`);
  },
  reviewPublication: (id, data) => apiRequest(`/publications/${id}/review/`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

export const eventService = {
  publicList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/events/public/${query ? `?${query}` : ''}`);
  },
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/events/${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/events/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/events/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const newsService = {
  publicList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/news/public/${query ? `?${query}` : ''}`);
  },
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/news/${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/news/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/news/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const multimediaService = {
  publicList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/multimedia/public/${query ? `?${query}` : ''}`);
  },
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/multimedia/${query ? `?${query}` : ''}`);
  },
  create: (data) => apiRequest('/multimedia/', {
    method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/multimedia/${id}/`, {
    method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data)
  }),
  download: async (id, filename = 'recurso-multimedia') => {
    const token = localStorage.getItem('aboccrim_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/multimedia/${id}/download/`, { headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'No se pudo descargar el recurso.');
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

export const agreementService = {
  publicList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/convenios/public/${query ? `?${query}` : ''}`);
  },
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/convenios/${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/convenios/${id}/`),
  create: (data) => apiRequest('/convenios/', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/convenios/${id}/`, { method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }),
  institutions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/instituciones/${query ? `?${query}` : ''}`);
  },
  createInstitution: (data) => apiRequest('/instituciones/', { method: 'POST', body: JSON.stringify(data) }),
  updateInstitution: (id, data) => apiRequest(`/instituciones/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  downloadDocument: async (id, filename = 'convenio.pdf') => {
    const token = localStorage.getItem('aboccrim_token');
    const response = await fetch(`${API_BASE_URL}/convenios/${id}/documento/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'No se pudo descargar el documento del convenio.');
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

export const incorporationService = {
  submit: (data) => apiRequest('/incorporacion/solicitudes/', {
    method: 'POST', body: data, skipAuth: true,
  }),
  tracking: (token) => apiRequest('/incorporacion/solicitudes/seguimiento/', {
    method: 'POST', body: JSON.stringify({ token }), skipAuth: true,
  }),
  submitSupportingDocuments: (data) => apiRequest('/incorporacion/solicitudes/seguimiento/documentos/', {
    method: 'POST', body: data, skipAuth: true,
  }),
  reviewList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/incorporacion/solicitudes/revision/${query ? `?${query}` : ''}`);
  },
  reviewDetail: (id) => apiRequest(`/incorporacion/solicitudes/${id}/revision/`),
  evaluate: (id, data) => apiRequest(`/incorporacion/solicitudes/${id}/evaluaciones/`, {
    method: 'POST', body: JSON.stringify(data),
  }),
  downloadSupportingDocument: async (applicationId, documentId, filename = 'documento.pdf') => {
    const token = localStorage.getItem('aboccrim_token');
    const response = await fetch(`${API_BASE_URL}/incorporacion/solicitudes/${applicationId}/documentos/${documentId}/download/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'No se pudo descargar el documento de la solicitud.');
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

export const repositoryService = {
  accessStatus: () => apiRequest('/repository/access-status/'),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/repository/${query ? `?${query}` : ''}`);
  },
  get: (id) => apiRequest(`/repository/${id}/`),
};

