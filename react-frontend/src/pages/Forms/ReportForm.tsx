import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { FileIcon, CloseIcon, DocsIcon, ShootingStarIcon, ArrowRightIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export default function ReportForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [aiAnalysisDone, setAiAnalysisDone] = useState(false);

  const [formData, setFormData] = useState({
    accident_location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    accident_date: "",
    weather_condition: "clear",
    road_condition: "dry",
    traffic_condition: "light",
    vehicle_description: "",
    damage_description: "",
    incident_description: "",
    injuries_description: "",
    other_party_name: "",
    other_party_ic: "",
    other_party_phone: "",
    other_party_vehicle: "",
  });

  const [photos, setPhotos] = useState<Array<{ file: File; preview: string; id: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ms`
      );
      const data = await response.json();

      if (data && data.display_name) {
        const addressParts = data.display_name.split(", ");
        const shortAddress = addressParts.slice(0, 4).join(", ");
        return shortAddress;
      }
      return null;
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return null;
    }
  };

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak disokong oleh pelayar ini");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const addressName = await reverseGeocode(latitude, longitude);

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          accident_location: addressName || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setLocationLoading(false);
      },
      (err) => {
        setLocationError("Tidak dapat mendapatkan lokasi. Sila pastikan GPS diaktifkan.");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (photos.length + acceptedFiles.length > 8) {
      setError("Maksimum 8 foto dibenarkan");
      return;
    }

    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    setAiAnalysisDone(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    onDrop(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onDrop(files);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== photoId);
    });
    setAiAnalysisDone(false);
  };

  const generateReport = async () => {
    if (photos.length === 0) {
      setError("Sila muat naik sekurang-kurangnya satu foto kemalangan");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const analysisData = new FormData();
      analysisData.append("file", photos[0].file);

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/reports/analyze-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: analysisData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        vehicle_description: data.vehicle_description || "",
        damage_description: data.damage_description || "",
        incident_description: data.incident_description || "",
      }));

      setAiAnalysisDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menganalisis foto. Sila cuba lagi.");
    } finally {
      setAnalyzing(false);
    }
  };

  const validateForm = () => {
    if (!formData.accident_date) {
      setError("Sila masukkan tarikh dan masa kemalangan");
      return false;
    }
    if (!formData.accident_location) {
      setError("Sila masukkan lokasi kemalangan");
      return false;
    }
    if (!formData.incident_description) {
      setError("Sila berikan penerangan insiden");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const reportData = {
        accident_date: new Date(formData.accident_date).toISOString(),
        accident_location: formData.accident_location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        weather_condition: formData.weather_condition,
        road_condition: formData.road_condition,
        traffic_condition: formData.traffic_condition,
        incident_description: formData.incident_description,
        damage_description: formData.damage_description,
        injuries_description: formData.injuries_description,
        vehicle_description: formData.vehicle_description,
        other_party_name: formData.other_party_name || null,
        other_party_ic: formData.other_party_ic || null,
        other_party_phone: formData.other_party_phone || null,
        other_party_vehicle: formData.other_party_vehicle || null,
      };

      const reportResponse = await fetch("http://localhost:8000/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      if (!reportResponse.ok) {
        throw new Error("Failed to create report");
      }

      const report = await reportResponse.json();

      if (photos.length > 0) {
        const photoData = new FormData();
        photos.forEach((photo) => {
          photoData.append("files", photo.file);
        });

        await fetch(`http://localhost:8000/reports/${report.id}/photos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: photoData,
        });
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghantar laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Laporan Kemalangan Baharu
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Muat naik foto kemalangan dan biarkan AI menganalisis untuk anda.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Photo Upload Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          <div className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-800 dark:text-white/90">
              <FileIcon className="size-5 mr-2" />
              Foto Kemalangan
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
              } ${photos.length >= 8 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileIcon className="size-12 mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-brand-500">Lepaskan foto di sini...</p>
              ) : (
                <div className="text-center">
                  <p className="mb-2 text-gray-600 dark:text-gray-400">
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
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.preview}
                      alt="Foto kemalangan"
                      className="h-32 w-auto max-w-[200px] object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 text-white bg-red-500 rounded-full hover:bg-red-600"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Report Button */}
            {photos.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={generateReport}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-normal text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <ArrowRightIcon className="size-5 animate-spin" />
                      <span>Menganalisis...</span>
                    </>
                  ) : (
                    <>
                      <ShootingStarIcon className="size-5" />
                      <span>Jana Laporan dengan AI</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {aiAnalysisDone && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-700">
                  ✓ Analisis AI selesai! Sila semak dan edit maklumat di bawah.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          <div className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-800 dark:text-white/90">
              <DocsIcon className="size-5 mr-2" />
              Lokasi Kemalangan
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <Label>
                  Koordinat / Alamat <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="accident_location"
                  value={formData.accident_location}
                  onChange={handleInputChange}
                  placeholder="cth., 3.139, 101.687 atau alamat penuh"
                />
                {locationError && (
                  <p className="mt-1 text-xs text-red-500">{locationError}</p>
                )}
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={findMyLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 whitespace-nowrap"
                >
                  {locationLoading ? (
                    <ArrowRightIcon className="size-4 animate-spin" />
                  ) : (
                    <DocsIcon className="size-4" />
                  )}
                  <span>{locationLoading ? "Mencari..." : "Cari Lokasi"}</span>
                </button>
              </div>
            </div>

            {formData.latitude && formData.longitude && (
              <p className="mt-2 text-xs text-gray-500">
                GPS: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Accident Details Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          <div className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-800 dark:text-white/90">
              <FileIcon className="size-5 mr-2" />
              Butiran Kemalangan
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>
                  Tarikh & Masa Kemalangan <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  name="accident_date"
                  value={formData.accident_date}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label>Keadaan Cuaca</Label>
                <select
                  name="weather_condition"
                  value={formData.weather_condition}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                >
                  <option value="clear">Cerah</option>
                  <option value="rainy">Hujan</option>
                  <option value="foggy">Berkabus</option>
                  <option value="cloudy">Mendung</option>
                </select>
              </div>

              <div>
                <Label>Keadaan Jalan</Label>
                <select
                  name="road_condition"
                  value={formData.road_condition}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                >
                  <option value="dry">Kering</option>
                  <option value="wet">Basah</option>
                  <option value="icy">Berais</option>
                  <option value="under_construction">Dalam Pembinaan</option>
                </select>
              </div>

              <div>
                <Label>Keadaan Lalu Lintas</Label>
                <select
                  name="traffic_condition"
                  value={formData.traffic_condition}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                >
                  <option value="light">Ringan</option>
                  <option value="moderate">Sederhana</option>
                  <option value="heavy">Padat</option>
                  <option value="stationary">Tidak Bergerak</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* AI Generated Content Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          <div className="p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-800 dark:text-white/90">
              <ShootingStarIcon className="size-5 mr-2" />
              Penerangan AI (Boleh Diedit)
            </h3>

            <div className="space-y-6">
              <div>
                <Label>Penerangan Kenderaan</Label>
                <textarea
                  name="vehicle_description"
                  value={formData.vehicle_description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                  placeholder="Jenis, jenama, model dan warna kenderaan..."
                />
              </div>

              <div>
                <Label>Penerangan Kerosakan</Label>
                <textarea
                  name="damage_description"
                  value={formData.damage_description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                  placeholder="Terangkan kerosakan pada kenderaan..."
                />
              </div>

              <div>
                <Label>
                  Penerangan Insiden <span className="text-error-500">*</span>
                </Label>
                <textarea
                  name="incident_description"
                  value={formData.incident_description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                  placeholder="Terangkan apa yang berlaku semasa kemalangan..."
                />
              </div>

              <div>
                <Label>Penerangan Kecederaan</Label>
                <textarea
                  name="injuries_description"
                  value={formData.injuries_description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 dark:border-gray-700 dark:bg-gray-dark dark:text-gray-400"
                  placeholder="Terangkan sebarang kecederaan (jika berkenaan)..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Other Party Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
          <div className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Maklumat Pihak Lain (Jika Berkenaan)
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Nama Pihak Lain</Label>
                <Input
                  type="text"
                  name="other_party_name"
                  value={formData.other_party_name}
                  onChange={handleInputChange}
                  placeholder="Nama penuh"
                />
              </div>

              <div>
                <Label>Nombor IC Pihak Lain</Label>
                <Input
                  type="text"
                  name="other_party_ic"
                  value={formData.other_party_ic}
                  onChange={handleInputChange}
                  placeholder="123456789012"
                />
              </div>

              <div>
                <Label>Telefon Pihak Lain</Label>
                <Input
                  type="tel"
                  name="other_party_phone"
                  value={formData.other_party_phone}
                  onChange={handleInputChange}
                  placeholder="+60123456789"
                />
              </div>

              <div>
                <Label>Kenderaan Pihak Lain</Label>
                <Input
                  type="text"
                  name="other_party_vehicle"
                  value={formData.other_party_vehicle}
                  onChange={handleInputChange}
                  placeholder="Jenama, model, nombor plat"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="px-6 py-3"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3"
          >
            {loading ? "Menghantar..." : "Hantar Laporan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
