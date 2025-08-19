import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await axios.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);

      // Get user info
      const userResponse = await axios.get('/auth/me');
      const userData = userResponse.data;
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      
      // Auto-login after registration
      const loginResult = await login(userData.email, userData.password);
      
      if (loginResult.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Registration successful but login failed. Please try logging in.',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// API helper functions
export const api = {
  // Reports
  createReport: async (reportData) => {
    const response = await axios.post('/reports', reportData);
    return response.data;
  },

  getUserReports: async () => {
    const response = await axios.get('/reports');
    return response.data;
  },

  getReport: async (id) => {
    const response = await axios.get(`/reports/${id}`);
    return response.data;
  },

  uploadPhotos: async (reportId, files, descriptions = []) => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    descriptions.forEach((desc) => {
      formData.append('descriptions', desc);
    });

    const response = await axios.post(`/reports/${reportId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // PDRM
  getAllReportsForPDRM: async () => {
    const response = await axios.get('/pdrm/reports');
    return response.data;
  },

  createPDRMStatement: async (statementData) => {
    const response = await axios.post('/pdrm/statements', statementData);
    return response.data;
  },

  updatePDRMStatement: async (statementId, updateData) => {
    const response = await axios.put(`/pdrm/statements/${statementId}`, updateData);
    return response.data;
  },

  // Insurance
  getReportsForInsurance: async () => {
    const response = await axios.get('/insurance/reports');
    return response.data;
  },

  analyzePhotos: async (analysisData) => {
    const response = await axios.post('/insurance/analyze', analysisData);
    return response.data;
  },

  analyzeLLMDiscrepancies: async (reportId) => {
    const response = await axios.post('/insurance/llm-analyze', { accident_report_id: reportId });
    return response.data;
  },

  analyzeCompleteReport: async (reportId) => {
    const response = await axios.post(`/insurance/analyze-complete/${reportId}`);
    return response.data;
  },

  createInsuranceAnalysis: async (analysisData) => {
    const response = await axios.post('/insurance/analysis', analysisData);
    return response.data;
  },
};