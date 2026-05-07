import os
import json
import aiohttp
from typing import List, Dict, Any
from PIL import Image
import base64
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

class VLMService:
    def __init__(self):
        self.api_key = os.getenv("VLM_API_KEY", "sk-2iTJBlqeaDWPTmGHm-kfbg")
        self.api_url = os.getenv("VLM_API_URL", "http://60.51.17.97:9999/v1/chat/completions")
        self.model = os.getenv("VLM_MODEL", "qwen3.5-397b-a17b-fp8-instruct")
        
    async def encode_image_to_base64(self, image_path: str) -> str:
        """Convert image to base64 for API transmission."""
        try:
            with Image.open(image_path) as img:
                # Resize image if too large (max 1024x1024 for most VLM APIs)
                if img.width > 1024 or img.height > 1024:
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Convert to base64
                buffer = BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                img_str = base64.b64encode(buffer.getvalue()).decode()
                return img_str
        except Exception as e:
            raise Exception(f"Error encoding image: {str(e)}")
    
    async def analyze_accident_photos(
        self, 
        photo_paths: List[str], 
        damage_description: str, 
        incident_description: str
    ) -> Dict[str, Any]:
        """
        Analyze accident photos using VLM API.
        This is a placeholder implementation that can be replaced with actual VLM API calls.
        """
        try:
            # Encode all images
            encoded_images = []
            for photo_path in photo_paths:
                if os.path.exists(photo_path):
                    encoded_img = await self.encode_image_to_base64(photo_path)
                    encoded_images.append(encoded_img)
            
            if not encoded_images:
                return {
                    "analysis": "No valid images found for analysis",
                    "consistency_score": 0.0,
                    "damage_assessment": "Unable to assess damage without images"
                }
            
            # Prepare the prompt for VLM analysis
            analysis_prompt = f"""
            Analisis foto-foto kemalangan berikut dan bandingkan dengan penerangan yang diberikan. BERIKAN SEMUA RESPONS DALAM BAHASA MELAYU.
            
            Penerangan Kerosakan: {damage_description}
            Penerangan Insiden: {incident_description}
            
            Sila berikan (DALAM BAHASA MELAYU):
            1. Analisis terperinci kerosakan yang kelihatan dalam foto
            2. Skor konsistensi (0-1) antara foto dan penerangan bertulis
            3. Penilaian tahap keterukan kerosakan dan anggaran kos pembaikan
            4. Sebarang percanggahan atau kebimbangan yang dicatat
            
            Fokus kepada:
            - Corak kerosakan kenderaan
            - Konsistensi dengan insiden yang dilaporkan
            - Bukti arah dan kekuatan hentaman
            - Sebarang tanda kerosakan sedia ada
            
            PENTING: Semua analisis mestilah dalam bahasa Melayu.
            """
            
            # Use actual VLM API if available, otherwise fall back to mock
            if self.api_url and "localhost:11434" in self.api_url:
                # Make actual API call to local Ollama
                analysis_result = await self._call_ollama_api(encoded_images, analysis_prompt)
            elif self.api_key and self.api_key != "your-vlm-api-key-here":
                # Make actual API call to other VLM provider
                analysis_result = await self._call_vlm_api(encoded_images, analysis_prompt)
            else:
                # Mock response for development
                analysis_result = await self._mock_vlm_analysis(
                    encoded_images, damage_description, incident_description
                )
            
            return analysis_result
            
        except Exception as e:
            return {
                "analysis": f"Error during VLM analysis: {str(e)}",
                "consistency_score": 0.0,
                "damage_assessment": "Analysis failed due to technical error"
            }
    
    async def _call_ollama_api(self, encoded_images: List[str], prompt: str) -> Dict[str, Any]:
        """Make API call to local Ollama VLM service."""
        try:
            # Ollama API format for vision models
            payload = {
                "model": self.model,
                "prompt": prompt,
                "images": encoded_images,
                "stream": False
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_url}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        analysis_text = result.get("response", "")
                        
                        # Parse the analysis to extract structured data
                        return self._parse_vlm_response(analysis_text)
                    else:
                        raise Exception(f"Ollama API error: {response.status}")
                        
        except Exception as e:
            # Fall back to mock analysis if Ollama is not available
            print(f"Ollama API call failed: {str(e)}, falling back to mock analysis")
            return await self._mock_vlm_analysis(encoded_images, "", "")

    async def _call_vlm_api(self, encoded_images: List[str], prompt: str) -> Dict[str, Any]:
        """Make actual API call to VLM service."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            *[{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img}"}}
                              for img in encoded_images]
                        ]
                    }
                ],
                "max_tokens": 1000
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        analysis_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        
                        # Parse the analysis to extract structured data
                        return self._parse_vlm_response(analysis_text)
                    else:
                        error_text = await response.text()
                        raise Exception(f"VLM API error: {response.status} - {error_text}")
                        
        except Exception as e:
            raise Exception(f"VLM API call failed: {str(e)}")
    
    async def _mock_vlm_analysis(
        self, 
        encoded_images: List[str], 
        damage_description: str, 
        incident_description: str
    ) -> Dict[str, Any]:
        """Mock VLM analysis for development purposes."""
        
        # Simulate analysis based on number of images and description length
        num_images = len(encoded_images)
        desc_length = len(damage_description) + len(incident_description)
        
        # Mock consistency score based on description detail
        consistency_score = min(0.9, max(0.3, (desc_length / 500) + (num_images * 0.1)))
        
        mock_analysis = f"""
        LAPORAN ANALISIS FOTO KEMALANGAN
        
        Imej Dianalisis: {num_images} foto
        
        PENILAIAN KEROSAKAN:
        - Kerosakan bampar hadapan konsisten dengan hentaman hadapan
        - Pemasangan lampu hadapan menunjukkan kerosakan hentaman
        - Ubah bentuk bonet menunjukkan perlanggaran sederhana kekuatan
        - Tiada bukti kerosakan hentaman sisi
        
        ANALISIS KONSISTENSI:
        - Bukti foto sejajar dengan penerangan insiden yang dilaporkan
        - Corak kerosakan sepadan dengan senario perlanggaran yang diterangkan
        - Tiada percanggahan jelas dicatat antara foto dan laporan
        
        ANGGARAN KEROSAKAN:
        - Anggaran kos pembaikan: RM 3,500 - RM 5,500
        - Tahap keterukan kerosakan: Sederhana
        - Keselamatan kenderaan: Berkemungkinan boleh dipandu dengan berhati-hati
        
        CADANGAN:
        - Pemeriksaan profesional disyorkan
        - Pemeriksaan integriti struktur dinasihatkan
        - Tiada bukti penipuan dikesan
        """
        
        damage_assessment = f"""
        Berdasarkan {num_images} foto yang dianalisis:
        - Kerosakan utama: Kerosakan perlanggaran bahagian hadapan
        - Kerosakan sekunder: Calar dan kemek kecil
        - Anggaran kos pembaikan: RM {3000 + (num_images * 500)} - RM {5000 + (num_images * 750)}
        - Tahap keterukan kerosakan: {'Teruk' if num_images > 6 else 'Sederhana' if num_images > 3 else 'Ringan'}
        """
        
        return {
            "analysis": mock_analysis,
            "consistency_score": round(consistency_score, 2),
            "damage_assessment": damage_assessment
        }
    
    def _parse_vlm_response(self, response_text: str) -> Dict[str, Any]:
        """Parse VLM response to extract structured data."""
        import re
        
        # Try to extract consistency score from response
        consistency_score = 0.7  # Default
        consistency_patterns = [
            r'consistency[:\s]*(\d+(?:\.\d+)?)',
            r'score[:\s]*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)%?\s*consistency',
            r'(\d+(?:\.\d+)?)/10',
            r'(\d+(?:\.\d+)?)\s*out\s*of\s*10'
        ]
        
        for pattern in consistency_patterns:
            match = re.search(pattern, response_text.lower())
            if match:
                try:
                    score = float(match.group(1))
                    if score > 1:  # If percentage or out of 10, convert to decimal
                        consistency_score = min(1.0, score / 100 if score <= 100 else score / 10)
                    else:
                        consistency_score = score
                    break
                except ValueError:
                    continue
        
        # Try to extract damage assessment
        damage_assessment = "Berdasarkan analisis VLM foto kemalangan"
        damage_patterns = [
            r'damage[:\s]*([^.]+\.)',
            r'assessment[:\s]*([^.]+\.)',
            r'repair cost[:\s]*([^.]+\.)',
            r'estimated[:\s]*([^.]+\.)'
        ]
        
        for pattern in damage_patterns:
            match = re.search(pattern, response_text, re.IGNORECASE)
            if match:
                damage_assessment = match.group(1).strip()
                break
        
        # If no specific damage assessment found, try to extract key points
        if damage_assessment == "Berdasarkan analisis VLM foto kemalangan":
            lines = response_text.split('\n')
            damage_lines = []
            for line in lines:
                if any(keyword in line.lower() for keyword in ['damage', 'repair', 'cost', 'severity']):
                    damage_lines.append(line.strip())
            
            if damage_lines:
                damage_assessment = '. '.join(damage_lines[:3])  # Take first 3 relevant lines
        
        return {
            "analysis": response_text,
            "consistency_score": min(1.0, max(0.0, consistency_score)),
            "damage_assessment": damage_assessment
        }
    
    async def analyze_accident_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a single accident image to extract vehicle, damage, and incident information.
        Used for the new simplified report creation flow.
        """
        try:
            # Encode the image
            encoded_image = await self.encode_image_to_base64(image_path)
            
            # Create prompt for extracting structured information
            analysis_prompt = """
            ANALISIS FOTO KEMALANGAN UNTUK PENGAMBILAN MAKLUMAT AUTOMATIK
            
            Sila analisis foto kemalangan ini dan berikan maklumat berikut DALAM BAHASA MELAYU:
            
            1. PENERANGAN KENDERAAN:
               - Jenis kenderaan (kereta, van, lori, motosikal, dll.)
               - Jenama dan model (jika boleh dikenal pasti)
               - Warna kenderaan
               - Sebarang ciri khas yang kelihatan (cth., nombor plat, kerosakan ketara)
            
            2. PENERANGAN KEROSAKAN:
               - Bahagian kenderaan yang rosak
               - Tahap keterukan kerosakan (ringan, sederhana, teruk)
               - Jenis kerosakan (kemek, calar, pecah, dll.)
               - Anggaran kos pembaikan (jika boleh dianggarkan)
            
            3. PENERANGAN INSIDEN:
               - Jenis kemalangan yang mungkin (hentaman hadapan, sisi, belakang, dll.)
               - Arah hentaman
               - Sebarang bukti yang menunjukkan bagaimana kemalangan berlaku
               - Keadaan persekitaran (cuaca, jalan, dll.)
            
            BERIKAN RESPONS DALAM FORMAT BERIKUT (SAHAJA, TANPA PENJELASAN TAMBAHAN):
            
            KENDERAAN: [penerangan kenderaan]
            KEROSAKAN: [penerangan kerosakan]
            INSIDEN: [penerangan insiden]
            """
            
            # Use actual VLM API if available, otherwise fall back to mock
            if self.api_url and "localhost:11434" in self.api_url:
                result = await self._call_ollama_api([encoded_image], analysis_prompt)
            elif self.api_key and self.api_key != "your-vlm-api-key-here":
                result = await self._call_image_vlm_api([encoded_image], analysis_prompt)
            else:
                result = await self._mock_image_analysis()
            
            return result
            
        except Exception as e:
            print(f"Error in analyze_accident_image: {str(e)}")
            return await self._mock_image_analysis()

    async def analyze_plate_number(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a vehicle image to extract the license plate number.
        Used for traffic fine checking (Semakan Saman).
        """
        try:
            # Encode the image
            encoded_image = await self.encode_image_to_base64(image_path)
            
            # Create prompt for plate number extraction
            analysis_prompt = """
            ANALISIS GAMBAR KENDERAAN UNTUK PENGAMBILAN NOMBOR PLAT
            
            Sila analisis foto kenderaan ini dan berikan maklumat berikut DALAM BAHASA MELAYU:
            
            1. NOMBOR PLAT: Nombor plat kenderaan yang kelihatan dalam foto (format: ABC 1234)
            2. JENIS KENDERAAN: Jenis kenderaan (kereta, van, lori, motosikal, dll.)
            3. WARNA KENDERAAN: Warna badan kenderaan
            4. TARIKH TAMAT PENDAFTARAN: Tarikh tamat pendaftaran (jika boleh dikenal pasti dari sticker)
            5. STATUS CUKAI JALAN: Status cukai jalan berdasarkan sticker (jika ada)
            
            BERIKAN RESPONS DALAM FORMAT BERIKUT (SAHAJA, TANPA PENJELASAN TAMBAHAN):
            
            PLAT: [nombor plat]
            JENIS: [jenis kenderaan]
            WARNA: [warna kenderaan]
            TAMAT: [tarikh tamat pendaftaran atau "Tidak dapat dikenal pasti"]
            CUKAI: [status cukai jalan atau "Tidak dapat dikenal pasti"]
            """
            
            # Use actual VLM API if available, otherwise fall back to mock
            if self.api_url and "localhost:11434" in self.api_url:
                result = await self._call_ollama_api([encoded_image], analysis_prompt)
            elif self.api_key and self.api_key != "your-vlm-api-key-here":
                result = await self._call_image_vlm_api([encoded_image], analysis_prompt)
                result = self._parse_plate_response(result.get("incident_description", ""))
            else:
                result = await self._mock_plate_analysis()
            
            return result
            
        except Exception as e:
            print(f"Error in analyze_plate_number: {str(e)}")
            return await self._mock_plate_analysis()

    async def analyze_license(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a driver license image to extract driver information.
        Used for traffic fine checking (Semakan Saman).
        """
        try:
            # Encode the image
            encoded_image = await self.encode_image_to_base64(image_path)
            
            # Create prompt for license extraction
            analysis_prompt = """
            ANALISIS GAMBAR LESEN MEMANDU UNTUK PENGAMBILAN MAKLUMAT PEMANDU
            
            Sila analisis foto lesen memandu ini dan berikan maklumat berikut DALAM BAHASA MELAYU:
            
            1. NAMA: Nama penuh pemandu seperti yang tertera pada lesen
            2. NO. IC: Nombor kad pengenalan pemandu
            3. NO. LESEN: Nombor lesen memandu
            4. WARGANEGARA: Kewarganegaraan pemandu
            5. KELAS: Kelas lesen memandu (cth: B2, B, D, dll.)
            6. TAMAT: Tarikh tamat tempoh lesen
            7. ALAMAT: Alamat pemandu seperti yang tertera
            
            BERIKAN RESPONS DALAM FORMAT BERIKUT (SAHAJA, TANPA PENJELASAN TAMBAHAN):
            
            NAMA: [nama penuh]
            IC: [nombor IC]
            LESEN: [nombor lesen]
            WARGANEGARA: [kewarganegaraan]
            KELAS: [kelas lesen]
            TAMAT: [tarikh tamat tempoh]
            ALAMAT: [alamat penuh]
            """
            
            # Use actual VLM API if available, otherwise fall back to mock
            if self.api_url and "localhost:11434" in self.api_url:
                result = await self._call_ollama_api([encoded_image], analysis_prompt)
            elif self.api_key and self.api_key != "your-vlm-api-key-here":
                result = await self._call_image_vlm_api([encoded_image], analysis_prompt)
                result = self._parse_license_response(result.get("incident_description", ""))
            else:
                result = await self._mock_license_analysis()
            
            return result
            
        except Exception as e:
            print(f"Error in analyze_license: {str(e)}")
            return await self._mock_license_analysis()

    async def _mock_plate_analysis(self) -> Dict[str, Any]:
        """Mock plate analysis for development purposes."""
        return {
            "plate_number": "WVA 1234",
            "vehicle_type": "Kereta penumpang",
            "vehicle_color": "Putih",
            "registration_expiry": "Tidak dapat dikenal pasti",
            "road_tax_status": "Tidak dapat dikenal pasti",
            "confidence_score": 0.85
        }
    
    async def _mock_license_analysis(self) -> Dict[str, Any]:
        """Mock license analysis for development purposes."""
        return {
            "name": "AHMAD BIN IBRAHIM",
            "ic_number": "801234-12-5678",
            "license_number": "L1234567",
            "nationality": "MALAYSIA",
            "class": "B2 - Motokar",
            "expiry_date": "2030-12-31",
            "address": "No. 123, Jalan Melati, Taman Sri Skudai, 81300 Skudai, Johor"
        }
    
    async def _mock_image_analysis(self) -> Dict[str, Any]:
        """Mock image analysis for development purposes."""
        return {
            "vehicle_description": "Kereta penumpang - Toyota Camry berwarna putih - kerosakan sederhana pada bahagian hadapan",
            "damage_description": "Kerosakan pada bampar hadapan dan penutup enjin - kemek sederhana pada bahagian kiri - lampu hadapan kanan pecah",
            "incident_description": "Kemalangan hentaman hadapan - kedua-dua kenderaan bergerak dari arah yang bertentangan - terdapat tanda brek di jalan",
            "confidence_score": 0.75
        }
    
    async def _call_image_vlm_api(self, encoded_images: List[str], prompt: str) -> Dict[str, Any]:
        """Make actual API call to VLM service for image analysis."""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Build content array with text and images
            content = [{"type": "text", "text": prompt}]
            for img in encoded_images:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{img}"
                    }
                })
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                "max_tokens": 1500
            }
            
            print(f"VLM API URL: {self.api_url}")
            print(f"VLM Model: {self.model}")
            print(f"Number of images: {len(encoded_images)}")
            print(f"Image data length: {len(encoded_images[0]) if encoded_images else 0}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, headers=headers, json=payload) as response:
                    status = response.status
                    response_text = await response.text()
                    print(f"VLM Response Status: {status}")
                    print(f"VLM Response Body: {response_text[:2000]}")
                    
                    if status == 200:
                        result = await response.json()
                        analysis_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        print(f"Extracted analysis text: {analysis_text[:500] if analysis_text else 'EMPTY'}")
                        
                        # Parse the analysis to extract structured data
                        return self._parse_image_response(analysis_text)
                    else:
                        raise Exception(f"VLM API error: {status} - {response_text}")
                        
        except Exception as e:
            print(f"VLM API call failed: {str(e)}")
            raise
    
    def _parse_image_response(self, response_text: str) -> Dict[str, Any]:
        """Parse VLM response to extract vehicle, damage, and incident information."""
        import re
        
        vehicle_description = ""
        damage_description = ""
        incident_description = ""
        
        # Extract vehicle description
        vehicle_match = re.search(r'KENDERAAN:\s*(.+?)(?=KEROSAKAN:|$)', response_text, re.DOTALL | re.IGNORECASE)
        if vehicle_match:
            vehicle_description = vehicle_match.group(1).strip()
        
        # Extract damage description
        damage_match = re.search(r'KEROSAKAN:\s*(.+?)(?=INSIDEN:|$)', response_text, re.DOTALL | re.IGNORECASE)
        if damage_match:
            damage_description = damage_match.group(1).strip()
        
        # Extract incident description
        incident_match = re.search(r'INSIDEN:\s*(.+?)$', response_text, re.DOTALL | re.IGNORECASE)
        if incident_match:
            incident_description = incident_match.group(1).strip()
        
        # If parsing failed, return the whole text as incident description
        if not vehicle_description and not damage_description and not incident_description:
            vehicle_description = "Tidak dapat mengenal pasti kenderaan daripada foto"
            damage_description = "Tidak dapat menilai kerosakan daripada foto"
            incident_description = response_text[:500] if len(response_text) > 500 else response_text
        
        return {
            "vehicle_description": vehicle_description,
            "damage_description": damage_description,
            "incident_description": incident_description,
            "confidence_score": 0.8
        }
    
    def _parse_plate_response(self, response_text: str) -> Dict[str, Any]:
        """Parse VLM response to extract plate number information."""
        import re
        
        plate_number = ""
        vehicle_type = ""
        vehicle_color = ""
        registration_expiry = "Tidak dapat dikenal pasti"
        road_tax_status = "Tidak dapat dikenal pasti"
        
        # Extract plate number
        plate_match = re.search(r'PLAT:\s*(.+?)(?=\n|JENIS:|$)', response_text, re.IGNORECASE)
        if plate_match:
            plate_number = plate_match.group(1).strip()
        
        # Extract vehicle type
        type_match = re.search(r'JENIS:\s*(.+?)(?=\n|WARNA:|$)', response_text, re.IGNORECASE)
        if type_match:
            vehicle_type = type_match.group(1).strip()
        
        # Extract vehicle color
        color_match = re.search(r'WARNA:\s*(.+?)(?=\n|TAMAT:|$)', response_text, re.IGNORECASE)
        if color_match:
            vehicle_color = color_match.group(1).strip()
        
        # Extract registration expiry
        expiry_match = re.search(r'TAMAT:\s*(.+?)(?=\n|CUKAI:|$)', response_text, re.IGNORECASE)
        if expiry_match:
            registration_expiry = expiry_match.group(1).strip()
        
        # Extract road tax status
        tax_match = re.search(r'CUKAI:\s*(.+?)(?=\n|$)', response_text, re.IGNORECASE)
        if tax_match:
            road_tax_status = tax_match.group(1).strip()
        
        # If parsing failed, try to find plate number pattern
        if not plate_number:
            plate_pattern = re.search(r'([A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3})', response_text)
            if plate_pattern:
                plate_number = plate_pattern.group(1).strip()
        
        return {
            "plate_number": plate_number,
            "vehicle_type": vehicle_type,
            "vehicle_color": vehicle_color,
            "registration_expiry": registration_expiry,
            "road_tax_status": road_tax_status,
            "confidence_score": 0.8
        }
    
    def _parse_license_response(self, response_text: str) -> Dict[str, Any]:
        """Parse VLM response to extract driver license information."""
        import re
        
        name = ""
        ic_number = ""
        license_number = ""
        nationality = ""
        license_class = ""
        expiry_date = ""
        address = ""
        
        # Extract name
        name_match = re.search(r'NAMA:\s*(.+?)(?=\n|IC:|$)', response_text, re.IGNORECASE)
        if name_match:
            name = name_match.group(1).strip()
        
        # Extract IC number
        ic_match = re.search(r'IC:\s*(.+?)(?=\n|LESEN:|$)', response_text, re.IGNORECASE)
        if ic_match:
            ic_number = ic_match.group(1).strip()
        
        # Extract license number
        license_match = re.search(r'LESEN:\s*(.+?)(?=\n|WARGANEGARA:|$)', response_text, re.IGNORECASE)
        if license_match:
            license_number = license_match.group(1).strip()
        
        # Extract nationality
        nationality_match = re.search(r'WARGANEGARA:\s*(.+?)(?=\n|KELAS:|$)', response_text, re.IGNORECASE)
        if nationality_match:
            nationality = nationality_match.group(1).strip()
        
        # Extract license class
        class_match = re.search(r'KELAS:\s*(.+?)(?=\n|TAMAT:|$)', response_text, re.IGNORECASE)
        if class_match:
            license_class = class_match.group(1).strip()
        
        # Extract expiry date
        expiry_match = re.search(r'TAMAT:\s*(.+?)(?=\n|ALAMAT:|$)', response_text, re.IGNORECASE)
        if expiry_match:
            expiry_date = expiry_match.group(1).strip()
        
        # Extract address
        address_match = re.search(r'ALAMAT:\s*(.+?)(?=\n|$)', response_text, re.IGNORECASE)
        if address_match:
            address = address_match.group(1).strip()
        
        return {
            "name": name,
            "ic_number": ic_number,
            "license_number": license_number,
            "nationality": nationality,
            "class": license_class,
            "expiry_date": expiry_date,
            "address": address
        }

# Global VLM service instance
vlm_service = VLMService()