import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    ic_number: '',
    phone_number: '',
    address: '',
    user_type: 'citizen',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Kata laluan tidak sepadan');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara');
      return false;
    }
    if (!/^\d{12}$/.test(formData.ic_number)) {
      setError('Nombor IC mestilah 12 digit');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-3 p-4 bg-gradient-police rounded-full shadow-police">
              <ShieldCheckIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Cipta Akaun
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Daftar untuk Sistem Laporan Kemalangan PDRM
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-body">
              {error && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-md">
                  <p className="text-sm text-danger-600">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label htmlFor="full_name" className="form-label">
                    Nama Penuh *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Masukkan nama penuh anda"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="form-label">
                    Alamat Emel *
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

                {/* IC Number */}
                <div>
                  <label htmlFor="ic_number" className="form-label">
                    Nombor IC *
                  </label>
                  <input
                    id="ic_number"
                    name="ic_number"
                    type="text"
                    required
                    className="form-input"
                    placeholder="123456789012"
                    maxLength="12"
                    value={formData.ic_number}
                    onChange={handleChange}
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone_number" className="form-label">
                    Nombor Telefon *
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required
                    className="form-input"
                    placeholder="+60123456789"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                </div>

                {/* User Type */}
                <div>
                  <label htmlFor="user_type" className="form-label">
                    Jenis Akaun *
                  </label>
                  <select
                    id="user_type"
                    name="user_type"
                    required
                    className="form-select"
                    value={formData.user_type}
                    onChange={handleChange}
                  >
                    <option value="citizen">Rakyat</option>
                    <option value="pdrm">Pegawai PDRM</option>
                    <option value="insurance">Ejen Insurans</option>
                  </select>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="form-label">
                    Alamat *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    required
                    className="form-textarea"
                    placeholder="Masukkan alamat penuh anda"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="form-label">
                    Kata Laluan *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="form-input pr-10"
                      placeholder="Masukkan kata laluan"
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

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Sahkan Kata Laluan *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="form-input pr-10"
                      placeholder="Sahkan kata laluan"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center py-3 text-base"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="spinner"></div>
                      <span>Sedang cipta akaun...</span>
                    </div>
                  ) : (
                    'Cipta Akaun'
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Sudah ada akaun?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-police-600 hover:text-police-500 transition-colors duration-200"
                  >
                    Log masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </form>

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

export default Register;