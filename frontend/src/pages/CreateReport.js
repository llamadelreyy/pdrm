import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const CreateReport = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Accident Details
    accident_date: '',
    accident_location: '',
    weather_condition: 'clear',
    road_condition: 'dry',
    traffic_condition: 'light',
    
    // Vehicle Details
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_plate: '',
    vehicle_color: '',
    
    // Incident Description
    incident_description: '',
    damage_description: '',
    injuries_description: '',
    
    // Other Party Details
    other_party_name: '',
    other_party_ic: '',
    other_party_phone: '',
    other_party_vehicle: '',
  });

  const [photos, setPhotos] = useState([]);
  const [photoDescriptions, setPhotoDescriptions] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const onDrop = (acceptedFiles) => {
    if (photos.length + acceptedFiles.length > 8) {
      setError('Maksimum 8 foto dibenarkan');
      return;
    }

    const newPhotos = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 10485760, // 10MB
    disabled: photos.length >= 8
  });

  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
    setPhotoDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[photoId];
      return newDescriptions;
    });
  };

  const updatePhotoDescription = (photoId, description) => {
    setPhotoDescriptions(prev => ({
      ...prev,
      [photoId]: description
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.accident_date && formData.accident_location && 
               formData.incident_description && formData.damage_description;
      case 2:
        return formData.vehicle_make && formData.vehicle_model && 
               formData.vehicle_plate && formData.vehicle_color;
      case 3:
        return true; // Photos are optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Sila isi semua medan yang diperlukan');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Convert date to ISO format
      const reportData = {
        ...formData,
        accident_date: new Date(formData.accident_date).toISOString(),
        vehicle_year: parseInt(formData.vehicle_year)
      };

      // Create the report
      const report = await api.createReport(reportData);

      // Upload photos if any
      if (photos.length > 0) {
        const files = photos.map(photo => photo.file);
        const descriptions = photos.map(photo => photoDescriptions[photo.id] || '');
        
        await api.uploadPhotos(report.id, files, descriptions);
      }

      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menghantar laporan');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Butiran Kemalangan', description: 'Maklumat asas mengenai insiden' },
    { number: 2, title: 'Maklumat Kenderaan', description: 'Butiran mengenai kenderaan anda' },
    { number: 3, title: 'Foto & Butiran Lain', description: 'Muat naik foto dan maklumat tambahan' },
    { number: 4, title: 'Semak & Hantar', description: 'Semak laporan anda sebelum penghantaran' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hantar Laporan Kemalangan</h1>
        <p className="mt-2 text-gray-600">
          Sila berikan maklumat yang tepat mengenai kemalangan anda. Semua medan yang bertanda * adalah wajib.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        {/* Mobile: Horizontal step numbers only */}
        <div className="flex md:hidden items-center justify-center space-x-4 mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm ${
                currentStep >= step.number
                  ? 'bg-police-600 border-police-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  currentStep > step.number ? 'bg-police-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Mobile: Current step title */}
        <div className="md:hidden text-center mb-4">
          <p className="text-sm font-medium text-police-600">
            {steps[currentStep - 1].title}
          </p>
          <p className="text-xs text-gray-500">{steps[currentStep - 1].description}</p>
        </div>

        {/* Desktop: Full step display */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-police-600 border-police-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {step.number}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-police-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-police-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-md">
          <p className="text-sm text-danger-600">{error}</p>
        </div>
      )}

      {/* Form Steps */}
      <div className="card">
        <div className="card-body">
          {currentStep === 1 && (
            <AccidentDetailsStep 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />
          )}
          
          {currentStep === 2 && (
            <VehicleDetailsStep 
              formData={formData} 
              handleInputChange={handleInputChange} 
            />
          )}
          
          {currentStep === 3 && (
            <PhotosAndOtherDetailsStep
              formData={formData}
              handleInputChange={handleInputChange}
              photos={photos}
              photoDescriptions={photoDescriptions}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              removePhoto={removePhoto}
              updatePhotoDescription={updatePhotoDescription}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewStep 
              formData={formData} 
              photos={photos}
              photoDescriptions={photoDescriptions}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="card-footer">
          <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
            >
              Sebelum
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Seterusnya
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary disabled:opacity-50 mobile-button"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="spinner"></div>
                    <span>Menghantar...</span>
                  </div>
                ) : (
                  'Hantar Laporan'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const AccidentDetailsStep = ({ formData, handleInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Butiran Kemalangan</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="form-label">Tarikh & Masa Kemalangan *</label>
        <input
          type="datetime-local"
          name="accident_date"
          value={formData.accident_date}
          onChange={handleInputChange}
          className="form-input"
          required
        />
      </div>

      <div>
        <label className="form-label">Keadaan Cuaca *</label>
        <select
          name="weather_condition"
          value={formData.weather_condition}
          onChange={handleInputChange}
          className="form-select"
          required
        >
          <option value="clear">Cerah</option>
          <option value="rainy">Hujan</option>
          <option value="foggy">Berkabus</option>
          <option value="cloudy">Mendung</option>
        </select>
      </div>

      <div>
        <label className="form-label">Keadaan Jalan *</label>
        <select
          name="road_condition"
          value={formData.road_condition}
          onChange={handleInputChange}
          className="form-select"
          required
        >
          <option value="dry">Kering</option>
          <option value="wet">Basah</option>
          <option value="icy">Berais</option>
          <option value="under_construction">Dalam Pembinaan</option>
        </select>
      </div>

      <div>
        <label className="form-label">Keadaan Lalu Lintas *</label>
        <select
          name="traffic_condition"
          value={formData.traffic_condition}
          onChange={handleInputChange}
          className="form-select"
          required
        >
          <option value="light">Ringan</option>
          <option value="moderate">Sederhana</option>
          <option value="heavy">Padat</option>
          <option value="stationary">Tidak Bergerak</option>
        </select>
      </div>
    </div>

    <div>
      <label className="form-label">Lokasi Kemalangan *</label>
      <textarea
        name="accident_location"
        value={formData.accident_location}
        onChange={handleInputChange}
        rows="3"
        className="form-textarea"
        placeholder="Berikan maklumat lokasi terperinci termasuk nama jalan, mercu tanda, dll."
        required
      />
    </div>

    <div>
      <label className="form-label">Penerangan Insiden *</label>
      <textarea
        name="incident_description"
        value={formData.incident_description}
        onChange={handleInputChange}
        rows="4"
        className="form-textarea"
        placeholder="Terangkan apa yang berlaku semasa kemalangan..."
        required
      />
    </div>

    <div>
      <label className="form-label">Penerangan Kerosakan *</label>
      <textarea
        name="damage_description"
        value={formData.damage_description}
        onChange={handleInputChange}
        rows="4"
        className="form-textarea"
        placeholder="Terangkan kerosakan pada kenderaan anda..."
        required
      />
    </div>

    <div>
      <label className="form-label">Penerangan Kecederaan</label>
      <textarea
        name="injuries_description"
        value={formData.injuries_description}
        onChange={handleInputChange}
        rows="3"
        className="form-textarea"
        placeholder="Terangkan sebarang kecederaan (jika berkenaan)..."
      />
    </div>
  </div>
);

const VehicleDetailsStep = ({ formData, handleInputChange }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Maklumat Kenderaan</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="form-label">Jenama Kenderaan *</label>
        <input
          type="text"
          name="vehicle_make"
          value={formData.vehicle_make}
          onChange={handleInputChange}
          className="form-input"
          placeholder="cth., Toyota, Honda, Proton"
          required
        />
      </div>

      <div>
        <label className="form-label">Model Kenderaan *</label>
        <input
          type="text"
          name="vehicle_model"
          value={formData.vehicle_model}
          onChange={handleInputChange}
          className="form-input"
          placeholder="cth., Camry, Civic, Saga"
          required
        />
      </div>

      <div>
        <label className="form-label">Tahun Kenderaan *</label>
        <input
          type="number"
          name="vehicle_year"
          value={formData.vehicle_year}
          onChange={handleInputChange}
          className="form-input"
          min="1900"
          max={new Date().getFullYear() + 1}
          required
        />
      </div>

      <div>
        <label className="form-label">Warna Kenderaan *</label>
        <input
          type="text"
          name="vehicle_color"
          value={formData.vehicle_color}
          onChange={handleInputChange}
          className="form-input"
          placeholder="cth., Putih, Hitam, Perak"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="form-label">Nombor Plat Kenderaan *</label>
        <input
          type="text"
          name="vehicle_plate"
          value={formData.vehicle_plate}
          onChange={handleInputChange}
          className="form-input"
          placeholder="cth., ABC 1234"
          required
        />
      </div>
    </div>
  </div>
);

const PhotosAndOtherDetailsStep = ({ 
  formData, 
  handleInputChange, 
  photos, 
  photoDescriptions,
  getRootProps, 
  getInputProps, 
  isDragActive,
  removePhoto,
  updatePhotoDescription
}) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Foto & Maklumat Tambahan</h3>
    
    {/* Photo Upload */}
    <div>
      <label className="form-label">Foto Kemalangan (Pilihan - Maksimum 8 foto)</label>
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'upload-area-active' : ''} ${
          photos.length >= 8 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-police-600">Lepaskan foto di sini...</p>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Seret & lepas foto di sini, atau klik untuk pilih
            </p>
            <p className="text-sm text-gray-500">
              JPEG, PNG sehingga 10MB setiap satu ({photos.length}/8 dimuat naik)
            </p>
          </div>
        )}
      </div>

      {/* Photo Preview */}
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.preview}
                alt="Foto kemalangan"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-2 -right-2 bg-danger-600 text-white rounded-full p-1 hover:bg-danger-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <textarea
                placeholder="Penerangan foto..."
                value={photoDescriptions[photo.id] || ''}
                onChange={(e) => updatePhotoDescription(photo.id, e.target.value)}
                className="mt-2 w-full text-xs form-textarea"
                rows="2"
              />
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Other Party Details */}
    <div>
      <h4 className="text-md font-medium text-gray-900 mb-4">Maklumat Pihak Lain (Jika Berkenaan)</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="form-label">Nama Pihak Lain</label>
          <input
            type="text"
            name="other_party_name"
            value={formData.other_party_name}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Nama penuh"
          />
        </div>

        <div>
          <label className="form-label">Nombor IC Pihak Lain</label>
          <input
            type="text"
            name="other_party_ic"
            value={formData.other_party_ic}
            onChange={handleInputChange}
            className="form-input"
            placeholder="123456789012"
          />
        </div>

        <div>
          <label className="form-label">Telefon Pihak Lain</label>
          <input
            type="tel"
            name="other_party_phone"
            value={formData.other_party_phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder="+60123456789"
          />
        </div>

        <div>
          <label className="form-label">Kenderaan Pihak Lain</label>
          <input
            type="text"
            name="other_party_vehicle"
            value={formData.other_party_vehicle}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Jenama, model, nombor plat"
          />
        </div>
      </div>
    </div>
  </div>
);

const ReviewStep = ({ formData, photos, photoDescriptions }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Semak Laporan Anda</h3>
    
    <div className="space-y-6">
      {/* Accident Details */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="font-medium text-gray-900 mb-3">Butiran Kemalangan</h4>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Tarikh:</span>
            <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2 break-words">
              {new Date(formData.accident_date).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Cuaca:</span>
            <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2 capitalize">{formData.weather_condition}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Jalan:</span>
            <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2 capitalize">{formData.road_condition}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium">Lokasi:</span>
            <span className="text-gray-900 mt-1 break-words">{formData.accident_location}</span>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="font-medium text-gray-900 mb-3">Maklumat Kenderaan</h4>
        <div className="space-y-3">
          <div className="flex flex-col">
            <span className="text-gray-500 font-medium">Kenderaan:</span>
            <span className="text-gray-900 mt-1 break-words">
              {formData.vehicle_year} {formData.vehicle_make} {formData.vehicle_model}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Plat:</span>
            <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2">{formData.vehicle_plate}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Warna:</span>
            <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2">{formData.vehicle_color}</span>
          </div>
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3">Foto ({photos.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.preview}
                  alt="Kemalangan"
                  className="w-full h-20 sm:h-24 object-cover rounded-lg border"
                />
                {photoDescriptions[photo.id] && (
                  <p className="text-xs text-gray-600 mt-1 truncate" title={photoDescriptions[photo.id]}>
                    {photoDescriptions[photo.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident Description */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="font-medium text-gray-900 mb-3">Penerangan Insiden</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed break-words">{formData.incident_description}</p>
        </div>
      </div>

      {/* Damage Description */}
      <div className="border-b border-gray-200 pb-4">
        <h4 className="font-medium text-gray-900 mb-3">Penerangan Kerosakan</h4>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed break-words">{formData.damage_description}</p>
        </div>
      </div>

      {/* Injuries Description */}
      {formData.injuries_description && (
        <div className="border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-900 mb-3">Penerangan Kecederaan</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed break-words">{formData.injuries_description}</p>
          </div>
        </div>
      )}

      {/* Other Party Information */}
      {(formData.other_party_name || formData.other_party_ic || formData.other_party_phone || formData.other_party_vehicle) && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Maklumat Pihak Lain</h4>
          <div className="space-y-3">
            {formData.other_party_name && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Nama:</span>
                <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2">{formData.other_party_name}</span>
              </div>
            )}
            {formData.other_party_ic && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">IC:</span>
                <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2">{formData.other_party_ic}</span>
              </div>
            )}
            {formData.other_party_phone && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-500 font-medium min-w-0 sm:min-w-[80px]">Telefon:</span>
                <span className="text-gray-900 mt-1 sm:mt-0 sm:ml-2">{formData.other_party_phone}</span>
              </div>
            )}
            {formData.other_party_vehicle && (
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium">Kenderaan:</span>
                <span className="text-gray-900 mt-1 break-words">{formData.other_party_vehicle}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default CreateReport;