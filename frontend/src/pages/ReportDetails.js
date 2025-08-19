import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { api } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  TruckIcon,
  PhotoIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportDetails = () => {
  const { id } = useParams();
  const { data: report, isLoading, error } = useQuery(
    ['report', id],
    () => api.getReport(id)
  );

  if (isLoading) return <LoadingSpinner text="Memuatkan butiran laporan..." />;
  if (error) return <div className="text-danger-600">Ralat memuatkan butiran laporan</div>;
  if (!report) return <div className="text-gray-600">Laporan tidak dijumpai</div>;

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
    <div className="max-w-4xl mx-auto mobile-container py-4 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-police-600 hover:text-police-700 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Kembali ke Papan Pemuka</span>
          </Link>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Laporan Kemalangan #{report.id}
            </h1>
            <p className="mt-2 text-gray-600">
              Dihantar pada {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className={`badge text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2 ${getStatusBadge(report.status)}`}>
            {getStatusText(report.status)}
          </span>
        </div>
      </div>

      <div className="mobile-spacing">
        {/* Accident Information */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-6 w-6 text-police-600" />
              <h2 className="text-xl font-semibold text-gray-900">Maklumat Kemalangan</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tarikh & Masa</p>
                    <p className="font-medium">{new Date(report.accident_date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Lokasi</p>
                    <p className="font-medium">{report.accident_location}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Keadaan Cuaca</p>
                  <p className="font-medium capitalize">{report.weather_condition}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Keadaan Jalan</p>
                  <p className="font-medium capitalize">{report.road_condition}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Keadaan Lalu Lintas</p>
                  <p className="font-medium capitalize">{report.traffic_condition}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-6 w-6 text-police-600" />
              <h2 className="text-xl font-semibold text-gray-900">Maklumat Kenderaan</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p className="text-sm text-gray-500">Jenama & Model</p>
                <p className="font-medium">{report.vehicle_make} {report.vehicle_model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tahun</p>
                <p className="font-medium">{report.vehicle_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nombor Plat</p>
                <p className="font-medium">{report.vehicle_plate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Warna</p>
                <p className="font-medium">{report.vehicle_color}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Description */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Penerangan Insiden</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Apa Yang Berlaku</h3>
                <p className="text-gray-700 leading-relaxed">{report.incident_description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Penerangan Kerosakan</h3>
                <p className="text-gray-700 leading-relaxed">{report.damage_description}</p>
              </div>

              {report.injuries_description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kecederaan</h3>
                  <p className="text-gray-700 leading-relaxed">{report.injuries_description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Other Party Information */}
        {(report.other_party_name || report.other_party_vehicle) && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Maklumat Pihak Lain</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {report.other_party_name && (
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p className="font-medium">{report.other_party_name}</p>
                  </div>
                )}
                {report.other_party_ic && (
                  <div>
                    <p className="text-sm text-gray-500">Nombor IC</p>
                    <p className="font-medium">{report.other_party_ic}</p>
                  </div>
                )}
                {report.other_party_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{report.other_party_phone}</p>
                  </div>
                )}
                {report.other_party_vehicle && (
                  <div>
                    <p className="text-sm text-gray-500">Kenderaan</p>
                    <p className="font-medium">{report.other_party_vehicle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <PhotoIcon className="h-6 w-6 text-police-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Foto ({report.photos.length})
                </h2>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.photos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={`/uploads/${photo.filename}`}
                      alt={`Foto kemalangan ${index + 1}`}
                      className="w-full h-32 sm:h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => window.open(`/uploads/${photo.filename}`, '_blank')}
                    />
                    {photo.description && (
                      <p className="text-sm text-gray-600">{photo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PDRM Statement */}
        {report.pdrm_statement && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-6 w-6 text-police-600" />
                <h2 className="text-xl font-semibold text-gray-900">Kenyataan PDRM</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="bg-police-50 border border-police-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-police-600">Nombor Kes</p>
                    <p className="font-medium text-police-800">{report.pdrm_statement.case_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-police-600">Penentuan Kesalahan</p>
                    <p className="font-medium text-police-800 capitalize">
                      {report.pdrm_statement.fault_determination.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-police-600 font-medium">Penemuan Pegawai</p>
                    <p className="text-police-800">{report.pdrm_statement.officer_findings}</p>
                  </div>

                  <div>
                    <p className="text-sm text-police-600 font-medium">Tindakan Disyorkan</p>
                    <p className="text-police-800">{report.pdrm_statement.recommended_action}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-police-200">
                  <p className="text-xs text-police-600">
                    Kenyataan dicipta pada {new Date(report.pdrm_statement.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insurance Analysis */}
        {report.insurance_analysis && (
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="h-6 w-6 text-police-600" />
                <h2 className="text-xl font-semibold text-gray-900">Analisis Insurans</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Status Tuntutan</p>
                    <p className="font-medium text-gray-800 capitalize">
                      {report.insurance_analysis.claim_status.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Skor Konsistensi</p>
                    <p className="font-medium text-gray-800">
                      {(report.insurance_analysis.consistency_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  {report.insurance_analysis.claim_amount && (
                    <div>
                      <p className="text-sm text-gray-600">Jumlah Tuntutan</p>
                      <p className="font-medium text-gray-800">
                        RM {report.insurance_analysis.claim_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Analisis Foto VLM</p>
                    <p className="text-gray-800 whitespace-pre-line">
                      {report.insurance_analysis.vlm_photo_analysis}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-medium">Penilaian Kerosakan</p>
                    <p className="text-gray-800">{report.insurance_analysis.damage_assessment}</p>
                  </div>

                  {report.insurance_analysis.notes && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Nota Tambahan</p>
                      <p className="text-gray-800">{report.insurance_analysis.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Analisis selesai pada {new Date(report.insurance_analysis.analyzed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Garis Masa Status</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-police-600 rounded-full"></div>
                <div>
                  <p className="font-medium">Laporan Dihantar</p>
                  <p className="text-sm text-gray-600">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {report.pdrm_statement && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-police-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Kenyataan PDRM Dicipta</p>
                    <p className="text-sm text-gray-600">
                      {new Date(report.pdrm_statement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {report.insurance_analysis && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-police-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Analisis Insurans Selesai</p>
                    <p className="text-sm text-gray-600">
                      {new Date(report.insurance_analysis.analyzed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;