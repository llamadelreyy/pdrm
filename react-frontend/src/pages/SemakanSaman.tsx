import { useState, useRef, useCallback } from "react";
import { FileIcon, CloseIcon, AlertIcon, InfoIcon, BoxIcon, DollarLineIcon, CalenderIcon, FolderIcon, UserCircleIcon } from "../icons";
import PageMeta from "../components/common/PageMeta";

interface Fine {
  id: string;
  plate_number: string;
  location: string;
  date: string;
  reason: string;
  amount: number;
  status: "belum_bayar" | "dibayar" | "hapus";
  officer_id: string;
}

interface CarStats {
  total_fines: number;
  total_amount: number;
  unpaid_amount: number;
  most_common_violation: string;
  last_violation_date: string;
  violations_by_month: { month: string; count: number }[];
}

interface DriverInfo {
  name: string;
  ic_number: string;
  license_number: string;
  address: string;
  expiry_date: string;
  nationality: string;
  class: string;
}

export default function SemakanSaman() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragActiveLicense, setIsDragActiveLicense] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLicenseFile, setSelectedLicenseFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [plateNumber, setPlateNumber] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState<CarStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Mock driver data based on OCR
  const mockDriverData: DriverInfo = {
    name: "AHMAD BIN IBRAHIM",
    ic_number: "801234-12-5678",
    license_number: "L1234567",
    address: "No. 123, Jalan Melati, Taman Sri Skudai, 81300 Skudai, Johor",
    expiry_date: "2030-12-31",
    nationality: "MALAYSIA",
    class: "B2 - Motokar"
  };

  // Mock fines data based on plate number
  const generateMockData = (plate: string): { fines: Fine[]; stats: CarStats } => {
    const mockFines: Fine[] = [
      {
        id: "1",
        plate_number: plate,
        location: "Jalan Bukit Bintang, Kuala Lumpur",
        date: "2024-12-15",
        reason: "Melebihi had laju",
        amount: 300,
        status: "belum_bayar",
        officer_id: "PDRM-1234",
      },
      {
        id: "2",
        plate_number: plate,
        location: "Jalan Sultan Ismail, Kuala Lumpur",
        date: "2024-11-20",
        reason: "Parkir di tempat larangan",
        amount: 100,
        status: "dibayar",
        officer_id: "PDRM-5678",
      },
      {
        id: "3",
        plate_number: plate,
        location: "Lebuhraya PLUS, Shah Alam",
        date: "2024-10-05",
        reason: "Tidak bayar toll",
        amount: 50,
        status: "dibayar",
        officer_id: "PDRM-9012",
      },
      {
        id: "4",
        plate_number: plate,
        location: "Jalan Pasar, Petaling Jaya",
        date: "2024-08-12",
        reason: "Menggunakan telefon semasa memandu",
        amount: 500,
        status: "belum_bayar",
        officer_id: "PDRM-3456",
      },
      {
        id: "5",
        plate_number: plate,
        location: "Jalan Ampang, Kuala Lumpur",
        date: "2024-06-30",
        reason: "Langgar lampu merah",
        amount: 400,
        status: "hapus",
        officer_id: "PDRM-7890",
      },
    ];

    const stats: CarStats = {
      total_fines: 5,
      total_amount: 1350,
      unpaid_amount: 800,
      most_common_violation: "Melebihi had laju",
      last_violation_date: "2024-12-15",
      violations_by_month: [
        { month: "Jun", count: 1 },
        { month: "Ogo", count: 1 },
        { month: "Okt", count: 1 },
        { month: "Nov", count: 1 },
        { month: "Dis", count: 1 },
      ],
    };

    return { fines: mockFines, stats };
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.type.startsWith("image/")) {
      setError("Sila muat naik fail gambar sahaja");
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setPlateNumber(null);
    setDriverInfo(null);
    setFines([]);
    setStats(null);
  }, []);

  const onDropLicense = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file.type.startsWith("image/")) {
      setError("Sila muat naik fail gambar sahaja");
      return;
    }

    setSelectedLicenseFile(file);
    setLicensePreview(URL.createObjectURL(file));
    setError("");
    setPlateNumber(null);
    setDriverInfo(null);
    setFines([]);
    setStats(null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDragOverLicense = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActiveLicense(true);
  };

  const handleDragLeaveLicense = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActiveLicense(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    onDrop(files);
  };

  const handleDropLicense = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActiveLicense(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    onDropLicense(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onDrop(files);
    }
  };

  const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onDropLicense(files);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedFile(null);
    setPlateNumber(null);
    setFines([]);
    setStats(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeLicenseImage = () => {
    if (licensePreview) {
      URL.revokeObjectURL(licensePreview);
    }
    setLicensePreview(null);
    setSelectedLicenseFile(null);
    setDriverInfo(null);
    if (licenseInputRef.current) {
      licenseInputRef.current.value = "";
    }
  };

  const analyzeImages = async () => {
    if (!selectedFile && !selectedLicenseFile) return;

    setAnalyzing(true);
    setError("");

    try {
      // Analyze car plate image
      if (selectedFile) {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("http://localhost:8000/semakan/analyze-plate", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze plate image");
        }

        const data = await response.json();
        const extractedPlate = data.plate_number;
        setPlateNumber(extractedPlate);

        // Generate mock data based on the plate number
        const { fines: mockFines, stats: mockStats } = generateMockData(extractedPlate);
        setFines(mockFines);
        setStats(mockStats);
      }

      // Analyze driver license image
      if (selectedLicenseFile) {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("file", selectedLicenseFile);

        const response = await fetch("http://localhost:8000/semakan/analyze-license", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze license image");
        }

        const data = await response.json();
        // Set driver info from OCR result
        setDriverInfo({
          name: data.name || mockDriverData.name,
          ic_number: data.ic_number || mockDriverData.ic_number,
          license_number: data.license_number || mockDriverData.license_number,
          address: data.address || mockDriverData.address,
          expiry_date: data.expiry_date || mockDriverData.expiry_date,
          nationality: data.nationality || mockDriverData.nationality,
          class: data.license_class || mockDriverData.class,
        });
      }
    } catch (err) {
      // Fallback to mock analysis if API fails
      console.error("Analysis error:", err);
      
      // Simulate plate number extraction from mock
      if (selectedFile) {
        const mockPlate = "WVA 1234";
        setPlateNumber(mockPlate);
        
        const { fines: mockFines, stats: mockStats } = generateMockData(mockPlate);
        setFines(mockFines);
        setStats(mockStats);
      }

      // Simulate driver license OCR
      if (selectedLicenseFile) {
        setDriverInfo(mockDriverData);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Fine["status"]) => {
    switch (status) {
      case "belum_bayar":
        return (
          <span className="inline-flex items-center rounded-full bg-red-10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-20 dark:text-red-400">
            Belum Bayar
          </span>
        );
      case "dibayar":
        return (
          <span className="inline-flex items-center rounded-full bg-green-10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:bg-green-20 dark:text-green-400">
            Dibayar
          </span>
        );
      case "hapus":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-10 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-20 dark:text-gray-400">
            Dibatalkan
          </span>
        );
    }
  };

  const canAnalyze = selectedFile || selectedLicenseFile;

  return (
    <>
      <PageMeta
        title="Analisa Kenderaan - PDRM Accident Reporting System"
        description="Analisa kenderaan menggunakan nombor plat"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">
              Analisa Kenderaan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Muat naik gambar kereta dan lesen pemandu untuk semakan
            </p>
          </div>
        </div>

        {/* Upload Section - Two Columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Car Image Upload */}
          <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
              Muat Naik Gambar Kereta
            </h2>
            
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-10 cursor-pointer transition-all ${
                  isDragActive
                    ? "border-brand- bg-brand-5 dark:bg-brand-10"
                    : "border-stroke hover:border-brand- hover:bg-gray-50 dark:border-dark-3 dark:hover:border-brand- dark:hover:bg-dark-3"
                }`}
              >
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-dark-3">
                  <FileIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="mb-2 text-lg font-medium text-dark dark:text-white">
                  {isDragActive ? "Lepaskan fail di sini" : "Seret & lepas gambar di sini"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  atau klik untuk memilih fail
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Sokong: JPG, PNG (Maksimum 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-[10px] border border-stroke p-4 dark:border-dark-3">
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <button
                  onClick={removeImage}
                  className="absolute right-2 top-2 rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-dark-3 dark:hover:bg-dark-4"
                >
                  <CloseIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Driver License Upload */}
          <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
            <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
              Muat Naik Lesen Pemandu
            </h2>
            
            {!licensePreview ? (
              <div
                onDragOver={handleDragOverLicense}
                onDragLeave={handleDragLeaveLicense}
                onDrop={handleDropLicense}
                onClick={() => licenseInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed p-10 cursor-pointer transition-all ${
                  isDragActiveLicense
                    ? "border-brand- bg-brand-5 dark:bg-brand-10"
                    : "border-stroke hover:border-brand- hover:bg-gray-50 dark:border-dark-3 dark:hover:border-brand- dark:hover:bg-dark-3"
                }`}
              >
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-dark-3">
                  <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="mb-2 text-lg font-medium text-dark dark:text-white">
                  {isDragActiveLicense ? "Lepaskan fail di sini" : "Seret & lepas gambar di sini"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  atau klik untuk memilih fail
                </p>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  Sokong: JPG, PNG (Maksimum 10MB)
                </p>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-[10px] border border-stroke p-4 dark:border-dark-3">
                <div className="relative h-48 w-full overflow-hidden rounded-lg">
                  <img
                    src={licensePreview}
                    alt="License Preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <button
                  onClick={removeLicenseImage}
                  className="absolute right-2 top-2 rounded-full bg-gray-100 p-2 hover:bg-gray-200 dark:bg-dark-3 dark:hover:bg-dark-4"
                >
                  <CloseIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        {canAnalyze && !plateNumber && !driverInfo && (
          <div className="flex justify-center">
            <button
              onClick={analyzeImages}
              disabled={analyzing}
              className="rounded-lg bg-brand-500 px-8 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:opacity-50"
            >
              {analyzing ? "Menganalisis..." : "Analisis"}
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-10 p-3 text-sm text-red-600 dark:bg-red-20 dark:text-red-400">
            <AlertIcon className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Results Section */}
        {(plateNumber || driverInfo) && (
          <>
            {/* Driver Info Section */}
            {driverInfo && (
              <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
                  Maklumat Pemandu
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Nama
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      No. IC
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.ic_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      No. Lesen
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.license_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Warganegara
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.nationality}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Kelas Lesen
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.class}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tamat Tempoh
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {formatDate(driverInfo.expiry_date)}
                    </p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Alamat
                    </p>
                    <p className="text-dark dark:text-white font-semibold">
                      {driverInfo.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Plate Number & Stats */}
            {plateNumber && stats && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Plate Number Card */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-brand-10 p-2">
                        <BoxIcon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Nombor Plat
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-dark dark:text-white">
                      {plateNumber}
                    </p>
                  </div>

                  {/* Total Fines */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-blue-10 p-2">
                        <AlertIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Jumlah Saman
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-dark dark:text-white">
                      {stats.total_fines}
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-green-10 p-2">
                        <DollarLineIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Jumlah Keseluruhan
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-dark dark:text-white">
                      {formatCurrency(stats.total_amount)}
                    </p>
                  </div>

                  {/* Unpaid Amount */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-red-10 p-2">
                        <DollarLineIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Belum Dibayar
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(stats.unpaid_amount)}
                    </p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Most Common Violation */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Pelanggaran Paling Biasa
                    </h3>
                    <p className="text-lg font-semibold text-dark dark:text-white">
                      {stats.most_common_violation}
                    </p>
                  </div>

                  {/* Last Violation */}
                  <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Pelanggaran Terakhir
                    </h3>
                    <p className="text-lg font-semibold text-dark dark:text-white">
                      {formatDate(stats.last_violation_date)}
                    </p>
                  </div>
                </div>

                {/* Fines List */}
                <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                  <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    Senarai Saman
                  </h2>
                  
                  {fines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <InfoIcon className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Tiada saman trafik dijumpai untuk plat ini
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-stroke dark:border-dark-3">
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                              Lokasi
                            </th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                              Tarikh
                            </th>
                            <th className="pb-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                              Reason
                            </th>
                            <th className="pb-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                              Jumlah
                            </th>
                            <th className="pb-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {fines.map((fine) => (
                            <tr
                              key={fine.id}
                              className="border-b border-stroke/50 dark:border-dark-3/50"
                            >
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <FolderIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-dark dark:text-white">
                                    {fine.location}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <CalenderIcon className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-dark dark:text-white">
                                    {formatDate(fine.date)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className="text-sm text-dark dark:text-white">
                                  {fine.reason}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <span className="text-sm font-medium text-dark dark:text-white">
                                  {formatCurrency(fine.amount)}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                {getStatusBadge(fine.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Monthly Violations Chart */}
                <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                  <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
                    Pelanggaran Mengikut Bulan
                  </h2>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {stats.violations_by_month.map((item) => (
                      <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full max-w-12 rounded-t-lg bg-brand-20 dark:bg-brand-30"
                          style={{
                            height: `${(item.count / Math.max(...stats.violations_by_month.map(v => v.count))) * 100}%`,
                          }}
                        >
                          <div className="flex h-full items-end justify-center rounded-t-lg bg-primary p-1">
                            <span className="text-xs font-medium text-white">
                              {item.count}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
