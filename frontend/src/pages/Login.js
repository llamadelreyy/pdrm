import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3 p-4 bg-gradient-police rounded-full shadow-police">
              <ShieldCheckIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sistem Laporan Kemalangan PDRM
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Polis Diraja Malaysia - Portal Rasmi
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Log masuk ke akaun anda
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              {error && (
                <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-sm text-danger-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="form-label">
                    Alamat Emel
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input"
                    placeholder="Masukkan alamat emel anda"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="form-label">
                    Kata Laluan
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="form-input pr-10"
                      placeholder="Masukkan kata laluan anda"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center py-3 text-base"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="spinner"></div>
                      <span>Sedang log masuk...</span>
                    </div>
                  ) : (
                    'Log Masuk'
                  )}
                </button>
              </div>

              {/* Register Link */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Belum ada akaun?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-police-600 hover:text-police-500 transition-colors duration-200"
                  >
                    Daftar di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Demo Accounts Info */}
        <div className="mt-8">
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Akaun Demo</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Rakyat:</span>
                  <span>citizen@demo.com / password</span>
                </div>
                <div className="flex justify-between">
                  <span>Pegawai PDRM:</span>
                  <span>pdrm@demo.com / password</span>
                </div>
                <div className="flex justify-between">
                  <span>Insurans:</span>
                  <span>insurance@demo.com / password</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 Polis Diraja Malaysia. Hak cipta terpelihara.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;