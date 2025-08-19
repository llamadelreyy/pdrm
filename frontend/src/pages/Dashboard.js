import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { api } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.user_type) {
      case 'citizen':
        return <CitizenDashboard />;
      case 'pdrm':
        return <PDRMDashboard />;
      case 'insurance':
        return <InsuranceDashboard />;
      default:
        return <div>Jenis pengguna tidak sah</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto mobile-container py-4 sm:py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Selamat Datang, {user?.full_name}
        </h1>
        <p className="mt-2 text-gray-600">
          {user?.user_type === 'citizen' && 'Urus laporan kemalangan anda dan jejaki status mereka.'}
          {user?.user_type === 'pdrm' && 'Semak laporan kemalangan dan cipta kenyataan rasmi.'}
          {user?.user_type === 'insurance' && 'Analisis laporan dan proses tuntutan insurans.'}
        </p>
      </div>

      {renderDashboard()}
    </div>
  );
};

const CitizenDashboard = () => {
  const { data: reports, isLoading, error } = useQuery('userReports', api.getUserReports);

  if (isLoading) return <LoadingSpinner text="Memuatkan laporan anda..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan laporan</div>;

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'badge-submitted',
      under_review: 'badge-under-review',
      completed: 'badge-completed',
    };
    return badges[status] || 'badge-submitted';
  };

  const getStatusText = (status) => {
    const texts = {
      submitted: 'Dihantar',
      under_review: 'Dalam Semakan',
      completed: 'Selesai',
    };
    return texts[status] || 'Tidak Diketahui';
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Link
          to="/reports/new"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <PlusIcon className="h-12 w-12 text-police-600 group-hover:text-police-700" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Laporan Baharu</h3>
            <p className="text-sm text-gray-600">Hantar laporan kemalangan baharu</p>
          </div>
        </Link>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reports?.length || 0}
            </h3>
            <p className="text-sm text-gray-600">Jumlah Laporan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <ClockIcon className="h-12 w-12 text-warning-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {reports?.filter(r => r.status === 'under_review').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Dalam Semakan</p>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Laporan Anda</h2>
        </div>
        <div className="card-body">
          {reports && reports.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Laporan #{report.id}
                        </h3>
                        <span className={`badge ${getStatusBadge(report.status)} text-xs`}>
                          {getStatusText(report.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Lokasi:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.accident_location}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Tarikh:</span>
                        <span className="text-sm text-gray-700 ml-2">
                          {new Date(report.created_at).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                      {report.accident_date && (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 min-w-[60px]">Insiden:</span>
                          <span className="text-sm text-gray-700 ml-2">
                            {new Date(report.accident_date).toLocaleDateString('ms-MY')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Link
                      to={`/reports/${report.id}`}
                      className="btn-primary w-full text-center mobile-button"
                    >
                      Lihat Butiran
                    </Link>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Laporan #{report.id}
                        </h3>
                        <span className={`badge ${getStatusBadge(report.status)}`}>
                          {getStatusText(report.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1 break-words">
                        <span className="font-medium">Lokasi:</span> {report.accident_location}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Dihantar: {new Date(report.created_at).toLocaleDateString('ms-MY')}</span>
                        {report.accident_date && (
                          <span>Insiden: {new Date(report.accident_date).toLocaleDateString('ms-MY')}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/reports/${report.id}`}
                      className="btn-secondary ml-4"
                    >
                      Lihat Butiran
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada laporan</h3>
              <p className="text-gray-600 mb-4">Mulakan dengan menghantar laporan kemalangan pertama anda.</p>
              <Link to="/reports/new" className="btn-primary mobile-button">
                Cipta Laporan Baharu
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PDRMDashboard = () => {
  const { data: reports, isLoading, error } = useQuery('pdrmReports', api.getAllReportsForPDRM);

  if (isLoading) return <LoadingSpinner text="Memuatkan laporan..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan laporan</div>;

  const pendingReports = reports?.filter(r => r.status === 'submitted') || [];
  const underReview = reports?.filter(r => r.status === 'under_review') || [];
  const completed = reports?.filter(r => r.status === 'completed') || [];

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-warning-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{pendingReports.length}</h3>
            <p className="text-sm text-gray-600">Menunggu Semakan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <ClockIcon className="h-12 w-12 text-police-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{underReview.length}</h3>
            <p className="text-sm text-gray-600">Dalam Semakan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-12 w-12 text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{completed.length}</h3>
            <p className="text-sm text-gray-600">Selesai</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{reports?.length || 0}</h3>
            <p className="text-sm text-gray-600">Jumlah Laporan</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Akses Pantas</h2>
        </div>
        <div className="card-body">
          <Link
            to="/pdrm"
            className="inline-flex items-center justify-center space-x-2 btn-primary mobile-button"
          >
            <ShieldCheckIcon className="h-5 w-5" />
            <span>Pergi ke Portal PDRM</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const InsuranceDashboard = () => {
  const { data: reports, isLoading, error } = useQuery('insuranceReports', api.getReportsForInsurance);

  if (isLoading) return <LoadingSpinner text="Memuatkan laporan..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan laporan</div>;

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon className="h-12 w-12 text-police-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{reports?.length || 0}</h3>
            <p className="text-sm text-gray-600">Laporan untuk Semakan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <ClockIcon className="h-12 w-12 text-warning-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => !r.insurance_analysis).length || 0}
            </h3>
            <p className="text-sm text-gray-600">Menunggu Analisis</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-12 w-12 text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.insurance_analysis).length || 0}
            </h3>
            <p className="text-sm text-gray-600">Dianalisis</p>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Akses Pantas</h2>
        </div>
        <div className="card-body">
          <Link
            to="/insurance"
            className="inline-flex items-center justify-center space-x-2 btn-primary mobile-button"
          >
            <BuildingOfficeIcon className="h-5 w-5" />
            <span>Pergi ke Portal Insurans</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;