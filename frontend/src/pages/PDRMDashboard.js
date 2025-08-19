import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const PDRMDashboard = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: reports, isLoading, error } = useQuery('pdrmReports', api.getAllReportsForPDRM);
  const queryClient = useQueryClient();

  const createStatementMutation = useMutation(api.createPDRMStatement, {
    onSuccess: () => {
      queryClient.invalidateQueries('pdrmReports');
      setShowStatementModal(false);
      setSelectedReport(null);
    }
  });

  if (isLoading) return <LoadingSpinner text="Memuatkan laporan..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan laporan</div>;

  const filteredReports = reports?.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return report.status === 'submitted';
    if (filter === 'under_review') return report.status === 'under_review';
    if (filter === 'completed') return report.status === 'completed';
    return true;
  }) || [];

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
      submitted: 'Menunggu Semakan',
      under_review: 'Dalam Semakan',
      completed: 'Selesai',
    };
    return texts[status] || 'Tidak Diketahui';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-police-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto mobile-container py-4 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-police-600" />
          <h1 className="text-3xl font-bold text-gray-900">Portal PDRM</h1>
        </div>
        <p className="text-gray-600">
          Semak laporan kemalangan dan cipta kenyataan polis rasmi.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <ExclamationTriangleIcon className="h-8 w-8 text-warning-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.status === 'submitted').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Menunggu Semakan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <ClockIcon className="h-8 w-8 text-police-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.status === 'under_review').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Dalam Semakan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <CheckCircleIcon className="h-8 w-8 text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.status === 'completed').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Selesai</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.length || 0}
            </h3>
            <p className="text-sm text-gray-600">Jumlah Laporan</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {[
            { key: 'all', label: 'Semua Laporan' },
            { key: 'pending', label: 'Menunggu Semakan' },
            { key: 'under_review', label: 'Dalam Semakan' },
            { key: 'completed', label: 'Selesai' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
                filter === filterOption.key
                  ? 'bg-police-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Laporan Kemalangan ({filteredReports.length})
          </h2>
        </div>
        <div className="card-body">
          {filteredReports.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(report.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          Laporan #{report.id}
                        </h3>
                      </div>
                      <span className={`badge ${getStatusBadge(report.status)} text-xs`}>
                        {getStatusText(report.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Rakyat:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.user?.full_name}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Lokasi:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.accident_location}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Tarikh:</span>
                        <span className="text-sm text-gray-700 ml-2">
                          {new Date(report.accident_date).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Kenderaan:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.vehicle_make} {report.vehicle_model} ({report.vehicle_plate})
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-[60px]">Foto:</span>
                        <span className="text-sm text-gray-700 ml-2">
                          {report.photos?.length || 0} dimuat naik
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500 mb-1">Penerangan Insiden:</p>
                      <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 p-2 rounded">
                        {report.incident_description}
                      </p>
                    </div>

                    {report.pdrm_statement && (
                      <div className="bg-police-50 border border-police-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-police-800 font-medium mb-2">
                          Kenyataan PDRM
                        </p>
                        <p className="text-xs text-police-700 mb-1">
                          <strong>Kes:</strong> {report.pdrm_statement.case_number}
                        </p>
                        <p className="text-xs text-police-700 line-clamp-2">
                          {report.pdrm_statement.officer_findings}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="btn-secondary w-full flex items-center justify-center space-x-2 mobile-button"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Lihat Butiran</span>
                      </button>

                      {!report.pdrm_statement && report.status === 'submitted' && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowStatementModal(true);
                          }}
                          className="btn-primary w-full flex items-center justify-center space-x-2 mobile-button"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Cipta Kenyataan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(report.status)}
                          <h3 className="text-lg font-medium text-gray-900">
                            Laporan #{report.id}
                          </h3>
                          <span className={`badge ${getStatusBadge(report.status)}`}>
                            {getStatusText(report.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Rakyat</p>
                            <p className="font-medium">{report.user?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Lokasi</p>
                            <p className="font-medium">{report.accident_location}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tarikh</p>
                            <p className="font-medium">
                              {new Date(report.accident_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Kenderaan</p>
                            <p className="font-medium">
                              {report.vehicle_make} {report.vehicle_model} ({report.vehicle_plate})
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Dihantar</p>
                            <p className="font-medium">
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Foto</p>
                            <p className="font-medium">{report.photos?.length || 0} dimuat naik</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1">Penerangan Insiden</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {report.incident_description}
                          </p>
                        </div>

                        {report.pdrm_statement && (
                          <div className="bg-police-50 border border-police-200 rounded-md p-3 mb-4">
                            <p className="text-sm text-police-800 font-medium mb-1">
                              Kenyataan PDRM (Kes: {report.pdrm_statement.case_number})
                            </p>
                            <p className="text-sm text-police-700">
                              {report.pdrm_statement.officer_findings}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="btn-secondary flex items-center justify-center space-x-2"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Lihat</span>
                        </button>

                        {!report.pdrm_statement && report.status === 'submitted' && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowStatementModal(true);
                            }}
                            className="btn-primary flex items-center justify-center space-x-2"
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span>Cipta Kenyataan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tiada laporan dijumpai</h3>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Tiada laporan kemalangan telah dihantar lagi.'
                  : `Tiada laporan dengan status "${filter}" dijumpai.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && !showStatementModal && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Create Statement Modal */}
      {showStatementModal && selectedReport && (
        <CreateStatementModal
          report={selectedReport}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedReport(null);
          }}
          onSubmit={createStatementMutation.mutate}
          loading={createStatementMutation.isLoading}
        />
      )}
    </div>
  );
};

// Report Details Modal Component
const ReportDetailsModal = ({ report, onClose }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl shadow-lg rounded-md bg-white mobile-modal">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Laporan #{report.id} - Butiran
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Tutup</span>
          ×
        </button>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Citizen Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Maklumat Rakyat</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nama:</span>
              <span className="ml-2">{report.user?.full_name}</span>
            </div>
            <div>
              <span className="text-gray-500">IC:</span>
              <span className="ml-2">{report.user?.ic_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Telefon:</span>
              <span className="ml-2">{report.user?.phone_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Emel:</span>
              <span className="ml-2">{report.user?.email}</span>
            </div>
          </div>
        </div>

        {/* Accident Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Butiran Kemalangan</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Tarikh & Masa:</span>
              <span className="ml-2">{new Date(report.accident_date).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Lokasi:</span>
              <span className="ml-2">{report.accident_location}</span>
            </div>
            <div>
              <span className="text-gray-500">Cuaca:</span>
              <span className="ml-2 capitalize">{report.weather_condition}</span>
            </div>
            <div>
              <span className="text-gray-500">Keadaan Jalan:</span>
              <span className="ml-2 capitalize">{report.road_condition}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Maklumat Kenderaan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Kenderaan:</span>
              <span className="ml-2">{report.vehicle_year} {report.vehicle_make} {report.vehicle_model}</span>
            </div>
            <div>
              <span className="text-gray-500">Plat:</span>
              <span className="ml-2">{report.vehicle_plate}</span>
            </div>
            <div>
              <span className="text-gray-500">Warna:</span>
              <span className="ml-2">{report.vehicle_color}</span>
            </div>
          </div>
        </div>

        {/* Descriptions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Penerangan Insiden</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            {report.incident_description}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Penerangan Kerosakan</h4>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
            {report.damage_description}
          </p>
        </div>

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Foto ({report.photos.length})</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {report.photos.map((photo, index) => (
                <img
                  key={index}
                  src={`/uploads/${photo.filename}`}
                  alt={`Foto kemalangan ${index + 1}`}
                  className="w-full h-20 sm:h-24 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn-secondary mobile-button">
          Tutup
        </button>
      </div>
    </div>
  </div>
);

// Create Statement Modal Component
const CreateStatementModal = ({ report, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    accident_report_id: report.id,
    officer_findings: '',
    fault_determination: '',
    recommended_action: '',
    case_number: `PDRM-${Date.now()}`
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-20 mx-auto p-3 sm:p-5 border w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl shadow-lg rounded-md bg-white mobile-modal">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Cipta Kenyataan PDRM - Laporan #{report.id}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nombor Kes</label>
            <input
              type="text"
              value={formData.case_number}
              onChange={(e) => setFormData({...formData, case_number: e.target.value})}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Penemuan Pegawai</label>
            <textarea
              value={formData.officer_findings}
              onChange={(e) => setFormData({...formData, officer_findings: e.target.value})}
              rows="4"
              className="form-textarea"
              placeholder="Terangkan penemuan anda berdasarkan laporan dan bukti..."
              required
            />
          </div>

          <div>
            <label className="form-label">Penentuan Kesalahan</label>
            <select
              value={formData.fault_determination}
              onChange={(e) => setFormData({...formData, fault_determination: e.target.value})}
              className="form-select"
              required
            >
              <option value="">Pilih penentuan kesalahan</option>
              <option value="citizen_at_fault">Rakyat bersalah</option>
              <option value="other_party_at_fault">Pihak lain bersalah</option>
              <option value="shared_fault">Kesalahan berkongsi</option>
              <option value="no_fault">Tiada kesalahan ditentukan</option>
              <option value="insufficient_evidence">Bukti tidak mencukupi</option>
            </select>
          </div>

          <div>
            <label className="form-label">Tindakan Disyorkan</label>
            <textarea
              value={formData.recommended_action}
              onChange={(e) => setFormData({...formData, recommended_action: e.target.value})}
              rows="3"
              className="form-textarea"
              placeholder="Syorkan langkah seterusnya atau tindakan yang perlu diambil..."
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary mobile-button"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mobile-button"
            >
              {loading ? 'Sedang cipta...' : 'Cipta Kenyataan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PDRMDashboard;