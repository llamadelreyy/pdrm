import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  EyeIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const InsuranceDashboard = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [vlmAnalysis, setVlmAnalysis] = useState(null);
  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [filter, setFilter] = useState('all');

  const { data: reports, isLoading, error } = useQuery('insuranceReports', api.getReportsForInsurance);
  const queryClient = useQueryClient();

  const analyzePhotosMutation = useMutation(api.analyzePhotos, {
    onSuccess: (data) => {
      setVlmAnalysis(data);
    }
  });

  const analyzeLLMMutation = useMutation(api.analyzeLLMDiscrepancies, {
    onSuccess: (data) => {
      setLlmAnalysis(data);
    }
  });

  const analyzeCompleteMutation = useMutation(api.analyzeCompleteReport, {
    onSuccess: (data) => {
      setVlmAnalysis(data.vlm_analysis);
      setLlmAnalysis(data.llm_analysis);
    }
  });

  const createAnalysisMutation = useMutation(api.createInsuranceAnalysis, {
    onSuccess: () => {
      queryClient.invalidateQueries('insuranceReports');
      setShowAnalysisModal(false);
      setSelectedReport(null);
      setVlmAnalysis(null);
      setLlmAnalysis(null);
    }
  });

  if (isLoading) return <LoadingSpinner text="Memuatkan laporan..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan laporan</div>;

  const filteredReports = reports?.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !report.insurance_analysis;
    if (filter === 'analyzed') return report.insurance_analysis;
    return true;
  }) || [];

  const getClaimStatusBadge = (status) => {
    const badges = {
      approved: 'badge-success',
      denied: 'badge-danger',
      pending_investigation: 'badge-under-review',
    };
    return badges[status] || 'badge-under-review';
  };

  const getClaimStatusText = (status) => {
    const texts = {
      approved: 'Diluluskan',
      denied: 'Ditolak',
      pending_investigation: 'Dalam Siasatan',
    };
    return texts[status] || 'Menunggu';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <BuildingOfficeIcon className="h-8 w-8 text-police-600" />
          <h1 className="text-3xl font-bold text-gray-900">Portal Insurans</h1>
        </div>
        <p className="text-gray-600">
          Analisis laporan kemalangan dan proses tuntutan insurans menggunakan teknologi VLM.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <ClockIcon className="h-8 w-8 text-warning-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => !r.insurance_analysis).length || 0}
            </h3>
            <p className="text-sm text-gray-600">Menunggu Analisis</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <CheckCircleIcon className="h-8 w-8 text-success-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.insurance_analysis?.claim_status === 'approved').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Tuntutan Diluluskan</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="flex justify-center mb-2">
              <XCircleIcon className="h-8 w-8 text-danger-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {reports?.filter(r => r.insurance_analysis?.claim_status === 'denied').length || 0}
            </h3>
            <p className="text-sm text-gray-600">Tuntutan Ditolak</p>
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
        <div className="flex space-x-4">
          {[
            { key: 'all', label: 'Semua Laporan' },
            { key: 'pending', label: 'Menunggu Analisis' },
            { key: 'analyzed', label: 'Dianalisis' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
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
            Laporan untuk Analisis ({filteredReports.length})
          </h2>
        </div>
        <div className="card-body">
          {filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-5 w-5 text-police-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Laporan #{report.id}
                        </h3>
                      </div>
                      {report.insurance_analysis && (
                        <span className={`badge ${getClaimStatusBadge(report.insurance_analysis.claim_status)} text-xs`}>
                          {getClaimStatusText(report.insurance_analysis.claim_status)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[70px]">Rakyat:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.user?.full_name}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 min-w-[70px]">Kenderaan:</span>
                        <span className="text-sm text-gray-900 ml-2 break-words flex-1">
                          {report.vehicle_make} {report.vehicle_model}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-[70px]">Tarikh:</span>
                        <span className="text-sm text-gray-700 ml-2">
                          {new Date(report.accident_date).toLocaleDateString('ms-MY')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 min-w-[70px]">Foto:</span>
                        <span className="text-sm text-gray-700 ml-2 flex items-center space-x-1">
                          <CameraIcon className="h-4 w-4" />
                          <span>{report.photos?.length || 0}</span>
                        </span>
                      </div>
                    </div>

                    {/* PDRM Statement - Mobile */}
                    {report.pdrm_statement && (
                      <div className="bg-police-50 border border-police-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-police-800 font-medium mb-2">
                          Kenyataan PDRM
                        </p>
                        <p className="text-xs text-police-700 mb-1">
                          <strong>Kes:</strong> {report.pdrm_statement.case_number}
                        </p>
                        <p className="text-xs text-police-700 mb-2">
                          <strong>Kesalahan:</strong> {report.pdrm_statement.fault_determination}
                        </p>
                        <p className="text-xs text-police-700 line-clamp-2">
                          {report.pdrm_statement.officer_findings}
                        </p>
                      </div>
                    )}

                    {/* Insurance Analysis - Mobile */}
                    {report.insurance_analysis && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-800 font-medium">
                            Analisis Insurans
                          </p>
                          <span className={`text-sm font-medium ${
                            report.insurance_analysis.consistency_score >= 0.7
                              ? 'text-success-600'
                              : report.insurance_analysis.consistency_score >= 0.4
                              ? 'text-warning-600'
                              : 'text-danger-600'
                          }`}>
                            {(report.insurance_analysis.consistency_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        {report.insurance_analysis.claim_amount && (
                          <p className="text-xs text-gray-700 mb-2">
                            <strong>Tuntutan:</strong> RM {report.insurance_analysis.claim_amount.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-700 line-clamp-2">
                          {report.insurance_analysis.damage_assessment}
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

                      {!report.insurance_analysis && report.photos && report.photos.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowAnalysisModal(true);
                          }}
                          className="btn-primary w-full flex items-center justify-center space-x-2 mobile-button"
                        >
                          <CpuChipIcon className="h-4 w-4" />
                          <span>Jalankan Analisis</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <DocumentTextIcon className="h-5 w-5 text-police-600" />
                          <h3 className="text-lg font-medium text-gray-900">
                            Laporan #{report.id}
                          </h3>
                          {report.insurance_analysis && (
                            <span className={`badge ${getClaimStatusBadge(report.insurance_analysis.claim_status)}`}>
                              {getClaimStatusText(report.insurance_analysis.claim_status)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Rakyat</p>
                            <p className="font-medium">{report.user?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Kenderaan</p>
                            <p className="font-medium">
                              {report.vehicle_make} {report.vehicle_model}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tarikh</p>
                            <p className="font-medium">
                              {new Date(report.accident_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Foto</p>
                            <p className="font-medium flex items-center space-x-1">
                              <CameraIcon className="h-4 w-4" />
                              <span>{report.photos?.length || 0}</span>
                            </p>
                          </div>
                        </div>

                        {/* PDRM Statement */}
                        {report.pdrm_statement && (
                          <div className="bg-police-50 border border-police-200 rounded-md p-3 mb-4">
                            <p className="text-sm text-police-800 font-medium mb-1">
                              Kenyataan PDRM (Kes: {report.pdrm_statement.case_number})
                            </p>
                            <p className="text-sm text-police-700 mb-2">
                              <strong>Kesalahan:</strong> {report.pdrm_statement.fault_determination}
                            </p>
                            <p className="text-sm text-police-700">
                              {report.pdrm_statement.officer_findings}
                            </p>
                          </div>
                        )}

                        {/* Insurance Analysis */}
                        {report.insurance_analysis && (
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm text-gray-800 font-medium">
                                Analisis Insurans
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">
                                  Skor Konsistensi:
                                </span>
                                <span className={`text-sm font-medium ${
                                  report.insurance_analysis.consistency_score >= 0.7
                                    ? 'text-success-600'
                                    : report.insurance_analysis.consistency_score >= 0.4
                                    ? 'text-warning-600'
                                    : 'text-danger-600'
                                }`}>
                                  {(report.insurance_analysis.consistency_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            {report.insurance_analysis.claim_amount && (
                              <p className="text-sm text-gray-700 mb-2">
                                <strong>Jumlah Tuntutan:</strong> RM {report.insurance_analysis.claim_amount.toLocaleString()}
                              </p>
                            )}
                            <p className="text-sm text-gray-700">
                              {report.insurance_analysis.damage_assessment}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Lihat</span>
                        </button>

                        {!report.insurance_analysis && report.photos && report.photos.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowAnalysisModal(true);
                            }}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <CpuChipIcon className="h-4 w-4" />
                            <span>Analisis</span>
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
                  ? 'Tiada laporan tersedia untuk semakan insurans.'
                  : `Tiada laporan dengan status "${filter}" dijumpai.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && !showAnalysisModal && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* VLM Analysis Modal */}
      {showAnalysisModal && selectedReport && (
        <VLMAnalysisModal
          report={selectedReport}
          vlmAnalysis={vlmAnalysis}
          llmAnalysis={llmAnalysis}
          onClose={() => {
            setShowAnalysisModal(false);
            setSelectedReport(null);
            setVlmAnalysis(null);
            setLlmAnalysis(null);
          }}
          onAnalyze={analyzePhotosMutation.mutate}
          onLLMAnalyze={analyzeLLMMutation.mutate}
          onCompleteAnalyze={analyzeCompleteMutation.mutate}
          onSubmit={createAnalysisMutation.mutate}
          analyzing={analyzePhotosMutation.isLoading}
          llmAnalyzing={analyzeLLMMutation.isLoading}
          completeAnalyzing={analyzeCompleteMutation.isLoading}
          submitting={createAnalysisMutation.isLoading}
        />
      )}
    </div>
  );
};

// Report Details Modal Component
const ReportDetailsModal = ({ report, onClose }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Laporan #{report.id} - Semakan Insurans
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* All the same content as PDRM modal but with insurance focus */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Maklumat Tuntutan</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Pemegang Polisi:</span>
              <span className="ml-2">{report.user?.full_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Kenderaan:</span>
              <span className="ml-2">{report.vehicle_year} {report.vehicle_make} {report.vehicle_model}</span>
            </div>
          </div>
        </div>

        {/* Photos for analysis */}
        {report.photos && report.photos.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Foto Bukti ({report.photos.length})</h4>
            <div className="grid grid-cols-3 gap-2">
              {report.photos.map((photo, index) => (
                <img
                  key={index}
                  src={`/uploads/${photo.filename}`}
                  alt={`Bukti ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}

        {/* PDRM Statement */}
        {report.pdrm_statement && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Penilaian PDRM</h4>
            <div className="bg-police-50 p-3 rounded">
              <p className="text-sm"><strong>Nombor Kes:</strong> {report.pdrm_statement.case_number}</p>
              <p className="text-sm"><strong>Penentuan Kesalahan:</strong> {report.pdrm_statement.fault_determination}</p>
              <p className="text-sm mt-2">{report.pdrm_statement.officer_findings}</p>
            </div>
          </div>
        )}

        {/* Insurance Analysis if exists */}
        {report.insurance_analysis && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Analisis Insurans</h4>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><strong>Status Tuntutan:</strong> {report.insurance_analysis.claim_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p className="text-sm"><strong>Skor Konsistensi:</strong> {(report.insurance_analysis.consistency_score * 100).toFixed(0)}%</p>
              {report.insurance_analysis.claim_amount && (
                <p className="text-sm"><strong>Jumlah Tuntutan:</strong> RM {report.insurance_analysis.claim_amount.toLocaleString()}</p>
              )}
              <p className="text-sm mt-2">{report.insurance_analysis.vlm_photo_analysis}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="btn-secondary">
          Tutup
        </button>
      </div>
    </div>
  </div>
);

// VLM Analysis Modal Component
const VLMAnalysisModal = ({ report, vlmAnalysis, llmAnalysis, onClose, onAnalyze, onLLMAnalyze, onCompleteAnalyze, onSubmit, analyzing, llmAnalyzing, completeAnalyzing, submitting }) => {
  const [formData, setFormData] = useState({
    accident_report_id: report.id,
    vlm_photo_analysis: '',
    damage_assessment: '',
    consistency_score: 0,
    claim_status: 'pending_investigation',
    claim_amount: '',
    notes: '',
    // LLM Analysis fields
    llm_confidence_score: null,
    discrepancy_analysis: '',
    key_discrepancies: '',
    risk_factors: '',
    supporting_evidence: '',
    consistency_assessment: ''
  });

  const handleAnalyze = () => {
    const photoUrls = report.photos.map(photo => `/uploads/${photo.filename}`);
    onAnalyze({
      photo_urls: photoUrls,
      damage_description: report.damage_description,
      incident_description: report.incident_description
    });
  };

  React.useEffect(() => {
    if (vlmAnalysis) {
      setFormData(prev => ({
        ...prev,
        vlm_photo_analysis: vlmAnalysis.analysis,
        damage_assessment: vlmAnalysis.damage_assessment,
        consistency_score: vlmAnalysis.consistency_score
      }));
    }
  }, [vlmAnalysis]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      claim_amount: formData.claim_amount ? parseFloat(formData.claim_amount) : null,
      // Process LLM analysis fields
      llm_confidence_score: formData.llm_confidence_score || (llmAnalysis ? llmAnalysis.confidence_score : null),
      discrepancy_analysis: formData.discrepancy_analysis || (llmAnalysis ? llmAnalysis.discrepancy_analysis : ''),
      consistency_assessment: formData.consistency_assessment || (llmAnalysis ? llmAnalysis.consistency_assessment : ''),
      // Convert text areas back to arrays for backend
      key_discrepancies: formData.key_discrepancies ?
        formData.key_discrepancies.split('\n').filter(item => item.trim()) :
        (llmAnalysis ? llmAnalysis.key_discrepancies : []),
      risk_factors: formData.risk_factors ?
        formData.risk_factors.split('\n').filter(item => item.trim()) :
        (llmAnalysis ? llmAnalysis.risk_factors : []),
      supporting_evidence: formData.supporting_evidence ?
        formData.supporting_evidence.split('\n').filter(item => item.trim()) :
        (llmAnalysis ? llmAnalysis.supporting_evidence : [])
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 sm:top-10 mx-auto p-3 sm:p-5 border w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl shadow-lg rounded-md bg-white mobile-modal">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Analisis VLM - Laporan #{report.id}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Photos */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Foto untuk Analisis</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
              {report.photos.map((photo, index) => (
                <img
                  key={index}
                  src={`/uploads/${photo.filename}`}
                  alt={`Analisis ${index + 1}`}
                  className="w-full h-16 sm:h-20 object-cover rounded border"
                />
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {!vlmAnalysis && !llmAnalysis && (
                <button
                  onClick={() => onCompleteAnalyze(report.id)}
                  disabled={completeAnalyzing}
                  className="btn-primary flex items-center justify-center space-x-2 mobile-button"
                >
                  <CpuChipIcon className="h-4 w-4" />
                  <span className="text-center">{completeAnalyzing ? 'Menganalisis...' : 'Jalankan Analisis Lengkap (VLM + LLM)'}</span>
                </button>
              )}
              
              {/* Legacy separate buttons for manual testing */}
              {(vlmAnalysis || llmAnalysis) && (
                <>
                  {!vlmAnalysis && (
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="btn-secondary flex items-center justify-center space-x-2 mobile-button"
                    >
                      <CpuChipIcon className="h-4 w-4" />
                      <span>{analyzing ? 'Menganalisis...' : 'Jalankan VLM Sahaja'}</span>
                    </button>
                  )}
                  
                  {report.pdrm_statement && !llmAnalysis && (
                    <button
                      onClick={() => onLLMAnalyze(report.id)}
                      disabled={llmAnalyzing}
                      className="btn-secondary flex items-center justify-center space-x-2 mobile-button"
                    >
                      <CpuChipIcon className="h-4 w-4" />
                      <span>{llmAnalyzing ? 'Menganalisis...' : 'Jalankan LLM Sahaja'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* LLM Discrepancy Analysis Results */}
          {llmAnalysis && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Keputusan Analisis Percanggahan LLM</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Skor Keyakinan:</span>
                  <span className={`text-lg font-bold ${
                    llmAnalysis.confidence_score >= 0.8 ? 'text-green-600' :
                    llmAnalysis.confidence_score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {(llmAnalysis.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-blue-800">Cadangan:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                    llmAnalysis.recommendation === 'approve' ? 'bg-green-100 text-green-800' :
                    llmAnalysis.recommendation === 'investigate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {llmAnalysis.recommendation.charAt(0).toUpperCase() + llmAnalysis.recommendation.slice(1)}
                  </span>
                </div>

                <div>
                  <span className="text-sm font-medium text-blue-800">Penilaian Konsistensi:</span>
                  <p className="text-sm text-blue-700 mt-1">{llmAnalysis.consistency_assessment}</p>
                </div>

                {llmAnalysis.key_discrepancies && llmAnalysis.key_discrepancies.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Percanggahan Utama:</span>
                    <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
                      {llmAnalysis.key_discrepancies.map((discrepancy, index) => (
                        <li key={index}>{discrepancy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmAnalysis.risk_factors && llmAnalysis.risk_factors.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Faktor Risiko:</span>
                    <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
                      {llmAnalysis.risk_factors.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llmAnalysis.supporting_evidence && llmAnalysis.supporting_evidence.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Bukti Sokongan:</span>
                    <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
                      {llmAnalysis.supporting_evidence.map((evidence, index) => (
                        <li key={index}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-blue-800">Analisis Terperinci:</span>
                  <div className="text-sm text-blue-700 mt-1 whitespace-pre-line bg-white p-3 rounded border">
                    {llmAnalysis.discrepancy_analysis}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Form */}
          {vlmAnalysis && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Keputusan Analisis VLM</label>
                <textarea
                  value={formData.vlm_photo_analysis}
                  onChange={(e) => setFormData({...formData, vlm_photo_analysis: e.target.value})}
                  rows="6"
                  className="form-textarea"
                  readOnly
                />
              </div>

              <div>
                <label className="form-label">Penilaian Kerosakan</label>
                <textarea
                  value={formData.damage_assessment}
                  onChange={(e) => setFormData({...formData, damage_assessment: e.target.value})}
                  rows="3"
                  className="form-textarea"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Skor Konsistensi</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.consistency_score}
                    onChange={(e) => setFormData({...formData, consistency_score: parseFloat(e.target.value)})}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Status Tuntutan</label>
                  <select
                    value={formData.claim_status}
                    onChange={(e) => setFormData({...formData, claim_status: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="pending_investigation">Menunggu Siasatan</option>
                    <option value="approved">Diluluskan</option>
                    <option value="denied">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Jumlah Tuntutan (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.claim_amount}
                  onChange={(e) => setFormData({...formData, claim_amount: e.target.value})}
                  className="form-input"
                  placeholder="Masukkan jumlah tuntutan jika diluluskan"
                />
              </div>

              {/* LLM Analysis Fields */}
              {llmAnalysis && (
                <>
                  <div>
                    <label className="form-label">Skor Keyakinan LLM (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.llm_confidence_score || llmAnalysis.confidence_score}
                      onChange={(e) => setFormData({...formData, llm_confidence_score: parseFloat(e.target.value)})}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Analisis Percanggahan</label>
                    <textarea
                      value={formData.discrepancy_analysis || llmAnalysis.discrepancy_analysis}
                      onChange={(e) => setFormData({...formData, discrepancy_analysis: e.target.value})}
                      className="form-textarea"
                      rows="4"
                    />
                  </div>

                  <div>
                    <label className="form-label">Percanggahan Utama (satu per baris)</label>
                    <textarea
                      value={formData.key_discrepancies || (llmAnalysis.key_discrepancies ? llmAnalysis.key_discrepancies.join('\n') : '')}
                      onChange={(e) => setFormData({...formData, key_discrepancies: e.target.value})}
                      className="form-textarea"
                      rows="3"
                      placeholder="Masukkan setiap percanggahan pada baris baharu"
                    />
                  </div>

                  <div>
                    <label className="form-label">Faktor Risiko (satu per baris)</label>
                    <textarea
                      value={formData.risk_factors || (llmAnalysis.risk_factors ? llmAnalysis.risk_factors.join('\n') : '')}
                      onChange={(e) => setFormData({...formData, risk_factors: e.target.value})}
                      className="form-textarea"
                      rows="3"
                      placeholder="Masukkan setiap faktor risiko pada baris baharu"
                    />
                  </div>

                  <div>
                    <label className="form-label">Bukti Sokongan (satu per baris)</label>
                    <textarea
                      value={formData.supporting_evidence || (llmAnalysis.supporting_evidence ? llmAnalysis.supporting_evidence.join('\n') : '')}
                      onChange={(e) => setFormData({...formData, supporting_evidence: e.target.value})}
                      className="form-textarea"
                      rows="3"
                      placeholder="Masukkan setiap bukti sokongan pada baris baharu"
                    />
                  </div>

                  <div>
                    <label className="form-label">Penilaian Konsistensi</label>
                    <textarea
                      value={formData.consistency_assessment || llmAnalysis.consistency_assessment}
                      onChange={(e) => setFormData({...formData, consistency_assessment: e.target.value})}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="form-label">Nota Tambahan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  className="form-textarea"
                  placeholder="Sebarang nota atau komen tambahan..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary mobile-button">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary mobile-button"
                >
                  {submitting ? 'Menghantar...' : 'Hantar Analisis'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceDashboard;