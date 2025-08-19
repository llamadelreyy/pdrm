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
        self.api_key = os.getenv("VLM_API_KEY")
        self.api_url = os.getenv("VLM_API_URL")
        self.model = os.getenv("VLM_MODEL", "qwen2.5vl:7b")
        
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
                "model": "vision-model",  # Replace with actual model name
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
                        raise Exception(f"VLM API error: {response.status}")
                        
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

# Global VLM service instance
vlm_service = VLMService()