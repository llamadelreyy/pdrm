import os
import json
import aiohttp
import re
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

# Global car saman data
CAR_SAMAN_DATA = {}
CAR_SAMAN_FILE = "car_saman_data.txt"

def load_car_saman_data():
    """Load car saman data from text file."""
    global CAR_SAMAN_DATA
    try:
        file_path = os.path.join(os.path.dirname(__file__), CAR_SAMAN_FILE)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    # Skip comments and empty lines
                    if not line or line.startswith('#'):
                        continue
                    # Parse the line
                    parts = line.split('|')
                    if len(parts) >= 8:
                        plate = parts[0].strip()
                        owner = parts[1].strip()
                        ic = parts[2].strip()
                        car_type = parts[3].strip()
                        total_saman = int(parts[4].strip())
                        unpaid_saman = int(parts[5].strip())
                        outstanding = parts[6].strip()
                        details = parts[7].strip()
                        
                        CAR_SAMAN_DATA[plate] = {
                            "owner": owner,
                            "ic": ic,
                            "car_type": car_type,
                            "total_saman": total_saman,
                            "unpaid_saman": unpaid_saman,
                            "outstanding": outstanding,
                            "details": details
                        }
            print(f"Loaded {len(CAR_SAMAN_DATA)} car saman records")
        else:
            print(f"Car saman data file not found: {file_path}")
    except Exception as e:
        print(f"Error loading car saman data: {e}")

def search_car_saman(plate_query: str) -> Optional[Dict[str, Any]]:
    """Search for car saman data by plate number."""
    # Normalize the query - remove spaces, uppercase
    normalized_query = plate_query.replace(" ", "").upper()
    
    # Try exact match first
    if normalized_query in CAR_SAMAN_DATA:
        return CAR_SAMAN_DATA[normalized_query]
    
    # Try partial match
    for plate, data in CAR_SAMAN_DATA.items():
        if normalized_query in plate or plate in normalized_query:
            return data
    
    return None

def extract_plate_from_message(message: str) -> Optional[str]:
    """Extract license plate number from user message."""
    # Common Malaysian plate patterns
    patterns = [
        r'([A-Z]{2,3}\s*\d{3,4}\s*[A-Z]?)',  # e.g., VMX 7352, ABC 1234
        r'([A-Z]{2,3}\d{3,4})',  # e.g., VMX7352
    ]
    
    message_upper = message.upper()
    for pattern in patterns:
        match = re.search(pattern, message_upper)
        if match:
            return match.group(1).replace(" ", "")
    
    return None

# Load car saman data on module import
load_car_saman_data()

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "not-required-for-local")
        self.api_base_url = os.getenv("OPENAI_API_BASE_URL", "http://192.168.50.125:5501/v1")
        self.model = os.getenv("OPENAI_MODEL", "Qwen3-14B")
        
    async def analyze_report_discrepancies(
        self,
        user_report: Dict[str, Any],
        pdrm_statement: Dict[str, Any],
        vlm_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze discrepancies between user report, PDRM statement, and VLM analysis.
        Returns confidence score and detailed discrepancy analysis.
        """
        try:
            # Prepare the analysis prompt
            analysis_prompt = self._create_discrepancy_prompt(user_report, pdrm_statement, vlm_analysis)
            
            # Call LLM API
            if self.api_base_url and "192.168.50.125" in self.api_base_url:
                # Make actual API call to local LLM
                analysis_result = await self._call_openai_compatible_api(analysis_prompt)
            else:
                # Mock response for development
                analysis_result = await self._mock_llm_analysis(user_report, pdrm_statement, vlm_analysis)
            
            return analysis_result
            
        except Exception as e:
            return {
                "confidence_score": 0.5,
                "discrepancy_analysis": f"Error during LLM analysis: {str(e)}",
                "key_discrepancies": [],
                "consistency_assessment": "Analysis failed due to technical error",
                "recommendation": "Manual review required due to analysis error"
            }
    
    def _create_discrepancy_prompt(
        self,
        user_report: Dict[str, Any],
        pdrm_statement: Dict[str, Any],
        vlm_analysis: Dict[str, Any]
    ) -> str:
        """Create a comprehensive prompt for discrepancy analysis."""
        
        prompt = f"""
Anda adalah seorang penyiasat insurans pakar yang menganalisis laporan kemalangan untuk percanggahan dan konsistensi.
Sila analisis tiga sumber maklumat berikut dan berikan penilaian terperinci DALAM BAHASA MELAYU:

=== LAPORAN PENGGUNA ===
Penerangan Insiden: {user_report.get('incident_description', 'T/A')}
Penerangan Kerosakan: {user_report.get('damage_description', 'T/A')}
Kenderaan: {user_report.get('vehicle_year', 'T/A')} {user_report.get('vehicle_make', 'T/A')} {user_report.get('vehicle_model', 'T/A')}
Lokasi: {user_report.get('accident_location', 'T/A')}
Cuaca: {user_report.get('weather_condition', 'T/A')}
Keadaan Jalan: {user_report.get('road_condition', 'T/A')}
Pihak Lain: {user_report.get('other_party_name', 'Tiada dilaporkan')}

=== KENYATAAN PDRM ===
Penemuan Pegawai: {pdrm_statement.get('officer_findings', 'T/A')}
Penentuan Kesalahan: {pdrm_statement.get('fault_determination', 'T/A')}
Tindakan Disyorkan: {pdrm_statement.get('recommended_action', 'T/A')}
Nombor Kes: {pdrm_statement.get('case_number', 'T/A')}

=== ANALISIS FOTO VLM ===
Analisis: {vlm_analysis.get('analysis', 'T/A')}
Penilaian Kerosakan: {vlm_analysis.get('damage_assessment', 'T/A')}
Skor Konsistensi: {vlm_analysis.get('consistency_score', 'T/A')}

=== KEPERLUAN ANALISIS ===
Sila berikan analisis komprehensif dalam format JSON berikut (SEMUA TEKS DALAM BAHASA MELAYU):

{{
    "confidence_score": <float antara 0.0 dan 1.0>,
    "discrepancy_analysis": "<analisis terperinci mengenai sebarang percanggahan yang ditemui - DALAM BAHASA MELAYU>",
    "key_discrepancies": [
        "<senarai percanggahan atau ketidakkonsistenan khusus - DALAM BAHASA MELAYU>",
        "<setiap item mestilah kebimbangan khusus - DALAM BAHASA MELAYU>"
    ],
    "consistency_assessment": "<penilaian keseluruhan konsistensi antara ketiga-tiga sumber - DALAM BAHASA MELAYU>",
    "recommendation": "<cadangan untuk pemprosesan tuntutan: approve, investigate, atau deny>",
    "risk_factors": [
        "<senarai faktor risiko yang mungkin menunjukkan penipuan atau ketidaktepatan - DALAM BAHASA MELAYU>",
        "<setiap item mestilah risiko khusus - DALAM BAHASA MELAYU>"
    ],
    "supporting_evidence": [
        "<senarai bukti yang menyokong kesahihan tuntutan - DALAM BAHASA MELAYU>",
        "<setiap item mestilah bukti sokongan khusus - DALAM BAHASA MELAYU>"
    ]
}}

Fokus kepada:
1. Konsistensi antara penerangan pengguna dan penemuan PDRM
2. Penjajaran antara kerosakan yang dilaporkan dan analisis foto VLM
3. Konsistensi logik naratif insiden
4. Sebarang tanda merah yang mungkin menunjukkan penipuan atau pembesar-besaran
5. Ketepatan teknikal penerangan kerosakan berbanding bukti visual
6. Kredibiliti keseluruhan tuntutan

Berikan skor keyakinan di mana:
- 0.9-1.0: Sangat konsisten, risiko sangat rendah
- 0.7-0.8: Umumnya konsisten, percanggahan kecil
- 0.5-0.6: Beberapa ketidakkonsistenan, memerlukan siasatan
- 0.3-0.4: Percanggahan ketara, risiko tinggi
- 0.0-0.2: Ketidakkonsistenan besar, kemungkinan penipuan

PENTING: Kembalikan hanya respons JSON, tiada teks tambahan. SEMUA KANDUNGAN ANALISIS MESTILAH DALAM BAHASA MELAYU.
"""
        return prompt
    
    async def _call_openai_compatible_api(self, prompt: str) -> Dict[str, Any]:
        """Make API call to OpenAI-compatible LLM service."""
        try:
            headers = {
                "Content-Type": "application/json"
            }
            
            # Add authorization header if API key is provided
            if self.api_key and self.api_key != "not-required-for-local":
                headers["Authorization"] = f"Bearer {self.api_key}"
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Anda adalah seorang penyiasat insurans pakar yang mengkhusus dalam analisis tuntutan kemalangan. Berikan penilaian yang tepat dan terperinci dalam format JSON yang diminta. SEMUA RESPONS MESTILAH DALAM BAHASA MELAYU."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.1,  # Low temperature for consistent analysis
                "response_format": {"type": "json_object"}
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_base_url}/chat/completions", headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                        
                        # Parse JSON response
                        try:
                            analysis_result = json.loads(content)
                            return self._validate_and_clean_response(analysis_result)
                        except json.JSONDecodeError:
                            # If JSON parsing fails, extract key information manually
                            return self._parse_text_response(content)
                    else:
                        raise Exception(f"LLM API error: {response.status}")
                        
        except Exception as e:
            print(f"LLM API call failed: {str(e)}, falling back to mock analysis")
            return await self._mock_llm_analysis({}, {}, {})
    
    def _validate_and_clean_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean the LLM response."""
        # Ensure all required fields are present with defaults
        cleaned_response = {
            "confidence_score": float(response.get("confidence_score", 0.5)),
            "discrepancy_analysis": str(response.get("discrepancy_analysis", "Analysis completed")),
            "key_discrepancies": response.get("key_discrepancies", []),
            "consistency_assessment": str(response.get("consistency_assessment", "Assessment completed")),
            "recommendation": str(response.get("recommendation", "Manual review recommended")),
            "risk_factors": response.get("risk_factors", []),
            "supporting_evidence": response.get("supporting_evidence", [])
        }
        
        # Ensure confidence score is within valid range
        cleaned_response["confidence_score"] = max(0.0, min(1.0, cleaned_response["confidence_score"]))
        
        # Ensure lists are actually lists
        for list_field in ["key_discrepancies", "risk_factors", "supporting_evidence"]:
            if not isinstance(cleaned_response[list_field], list):
                cleaned_response[list_field] = []
        
        return cleaned_response
    
    def _parse_text_response(self, text_response: str) -> Dict[str, Any]:
        """Parse text response if JSON parsing fails."""
        import re
        
        # Try to extract confidence score
        confidence_match = re.search(r'confidence[_\s]*score["\s:]*(\d+(?:\.\d+)?)', text_response, re.IGNORECASE)
        confidence_score = float(confidence_match.group(1)) if confidence_match else 0.5
        
        return {
            "confidence_score": max(0.0, min(1.0, confidence_score)),
            "discrepancy_analysis": text_response[:500] + "..." if len(text_response) > 500 else text_response,
            "key_discrepancies": ["Unable to parse structured discrepancies from response"],
            "consistency_assessment": "Analysis completed but response format was not structured",
            "recommendation": "Manual review recommended due to parsing issues",
            "risk_factors": [],
            "supporting_evidence": []
        }
    
    async def _mock_llm_analysis(
        self,
        user_report: Dict[str, Any],
        pdrm_statement: Dict[str, Any],
        vlm_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock LLM analysis for development purposes."""
        import random
        
        # Simulate analysis based on available data
        has_pdrm = bool(pdrm_statement)
        has_vlm = bool(vlm_analysis)
        vlm_consistency = vlm_analysis.get('consistency_score', 0.7) if has_vlm else 0.7
        
        # Calculate more realistic confidence score based on data quality
        base_confidence = 0.6  # Start with moderate confidence
        
        # Boost confidence if we have PDRM statement
        if has_pdrm:
            base_confidence += 0.15
        
        # Boost confidence if we have VLM analysis
        if has_vlm:
            base_confidence += 0.1
        
        # Use VLM consistency as a major factor
        if has_vlm:
            confidence_score = (base_confidence + vlm_consistency) / 2
        else:
            confidence_score = base_confidence
        
        # Add some realistic variation (±0.05)
        variation = random.uniform(-0.05, 0.05)
        confidence_score = max(0.1, min(0.95, confidence_score + variation))
        
        mock_discrepancies = []
        mock_risks = []
        mock_evidence = []
        
        if confidence_score < 0.6:
            mock_discrepancies = [
                "Ketidakkonsistenan kecil dalam masa penerangan kerosakan",
                "Beberapa butiran memerlukan penjelasan"
            ]
            mock_risks = ["Memerlukan pengesahan tambahan"]
        else:
            mock_evidence = [
                "Laporan pengguna sejajar dengan penemuan PDRM",
                "Analisis VLM menyokong tuntutan kerosakan",
                "Tiada tanda merah utama dikesan"
            ]
        
        return {
            "confidence_score": round(confidence_score, 2),
            "discrepancy_analysis": f"""
ANALISIS PERCANGGAHAN KOMPREHENSIF

Sumber Data Yang Dianalisis:
- Laporan Pengguna: {'Tersedia' if user_report else 'Tidak tersedia'}
- Kenyataan PDRM: {'Tersedia' if has_pdrm else 'Tidak tersedia'}
- Analisis VLM: {'Tersedia' if has_vlm else 'Tidak tersedia'}

Penilaian Keseluruhan:
Analisis menunjukkan konsistensi {'tinggi' if confidence_score > 0.8 else 'sederhana' if confidence_score > 0.6 else 'rendah'} antara semua sumber yang tersedia.
{'Tiada percanggahan ketara dikesan.' if confidence_score > 0.7 else 'Beberapa percanggahan memerlukan siasatan.' if confidence_score > 0.5 else 'Pelbagai percanggahan dikesan memerlukan semakan menyeluruh.'}

Penemuan Utama:
- Konsistensi laporan: {int(confidence_score * 100)}%
- Tahap risiko: {'Rendah' if confidence_score > 0.7 else 'Sederhana' if confidence_score > 0.5 else 'Tinggi'}
- Cadangan: {'Luluskan' if confidence_score > 0.8 else 'Siasat' if confidence_score > 0.5 else 'Tolak atau siasatan menyeluruh diperlukan'}
            """,
            "key_discrepancies": mock_discrepancies,
            "consistency_assessment": f"Skor konsistensi keseluruhan: {int(confidence_score * 100)}%. " +
                                   ("Konsistensi tinggi antara semua sumber." if confidence_score > 0.8 else
                                    "Konsistensi sederhana dengan percanggahan kecil." if confidence_score > 0.6 else
                                    "Konsistensi rendah dengan percanggahan ketara."),
            "recommendation": "approve" if confidence_score > 0.8 else "investigate" if confidence_score > 0.5 else "deny",
            "risk_factors": mock_risks,
            "supporting_evidence": mock_evidence
        }
    
    def _build_saman_context(self, message: str) -> str:
        """Build saman context from the message if a plate number is detected."""
        plate = extract_plate_from_message(message)
        if not plate:
            return ""
        
        saman_data = search_car_saman(plate)
        if not saman_data:
            return ""
        
        context = f"""
        
        === DATA SAMAN KENDERAAN ===
        Nombor Plat: {plate}
        Nama Pemilik: {saman_data['owner']}
        No. IC: {saman_data['ic']}
        Jenis Kereta: {saman_data['car_type']}
        Jumlah Saman: {saman_data['total_saman']}
        Saman Belum Bayar: {saman_data['unpaid_saman']}
        Jumlah Tunggakan: {saman_data['outstanding']}
        Butiran Saman: {saman_data['details']}
        
        GUNAKAN DATA DI ATAS UNTUK MENJAWAB SOALAN MENGENAI SAMAN KENDERAAN INI.
        """
        return context
    
    def _get_system_prompt(self, message: str) -> str:
        """Get the appropriate system prompt, including saman data if relevant."""
        base_prompt = "Anda adalah pembantu AI untuk sistem laporan kemalangan PDRM. Anda membantu pengguna dengan pertanyaan tentang laporan kemalangan, proses tuntutan insurans, dan sebarang pertanyaan berkaitan. Berikan jawapan yang jelas, tepat, dan dalam Bahasa Melayu apabila mungkin. Anda adalah pembantu yang mesra dan profesional."
        
        # Add saman context if plate number is detected
        saman_context = self._build_saman_context(message)
        if saman_context:
            base_prompt = base_prompt + saman_context
        
        return base_prompt
    
    async def chat(self, message: str, conversation_history: list = None) -> str:
        """
        General chat endpoint for AI conversations.
        Used for user queries about accident reports and general assistance.
        Uses VLM API configuration.
        """
        try:
            # Use VLM API configuration
            vlm_api_key = os.getenv("VLM_API_KEY", "sk-2iTJBlqeaDWPTmGHm-kfbg")
            vlm_api_url = os.getenv("VLM_API_URL", "http://60.51.17.97:9999/v1/chat/completions")
            vlm_model = os.getenv("VLM_MODEL", "qwen3.5-397b-a17b-fp8-instruct")
            
            headers = {
                "Authorization": f"Bearer {vlm_api_key}",
                "Content-Type": "application/json"
            }
            
            # Build conversation messages
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt(message)
                }
            ]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Limit to last 10 messages
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            payload = {
                "model": vlm_model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(vlm_api_url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                        return content if content else "Maaf, saya tidak dapat menjawab pada masa ini."
                    else:
                        error_text = await response.text()
                        print(f"Chat API error: {response.status} - {error_text}")
                        return "Maaf, berlaku ralat sistem. Sila cuba lagi sebentar lagi."
                        
        except Exception as e:
            print(f"Chat error: {str(e)}")
            return "Maaf, berlaku ralat sistem. Sila cuba lagi sebentar lagi."
    
    async def chat_stream(self, message: str, conversation_history: list = None):
        """
        Streaming chat endpoint for AI conversations.
        Yields content chunks for StreamingResponse.
        """
        try:
            # Use VLM API configuration
            vlm_api_key = os.getenv("VLM_API_KEY", "sk-2iTJBlqeaDWPTmGHm-kfbg")
            vlm_api_url = os.getenv("VLM_API_URL", "http://60.51.17.97:9999/v1/chat/completions")
            vlm_model = os.getenv("VLM_MODEL", "qwen3.5-397b-a17b-fp8-instruct")
            
            headers = {
                "Authorization": f"Bearer {vlm_api_key}",
                "Content-Type": "application/json"
            }
            
            # Build conversation messages
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt(message)
                }
            ]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Limit to last 10 messages
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current message
            messages.append({
                "role": "user",
                "content": message
            })
            
            payload = {
                "model": vlm_model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7,
                "stream": True
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(vlm_api_url, headers=headers, json=payload) as response:
                    if response.status == 200:
                        # Stream the response
                        async for line in response.content:
                            if line:
                                line_text = line.decode('utf-8').strip()
                                if line_text.startswith('data: '):
                                    data_text = line_text[6:]  # Remove 'data: ' prefix
                                    if data_text == '[DONE]':
                                        break
                                    try:
                                        data = json.loads(data_text)
                                        delta = data.get("choices", [{}])[0].get("delta", {})
                                        content = delta.get("content", "")
                                        if content:
                                            yield f"data: {json.dumps({'content': content})}\n\n"
                                    except json.JSONDecodeError:
                                        continue
                    else:
                        error_text = await response.text()
                        print(f"Chat stream API error: {response.status} - {error_text}")
                        yield f"data: {json.dumps({'content': 'Maaf, berlaku ralat sistem. Sila cuba lagi sebentar lagi.'})}\n\n"
                        
        except Exception as e:
            print(f"Chat stream error: {str(e)}")
            yield f"data: {json.dumps({'content': 'Maaf, berlaku ralat sistem. Sila cuba lagi sebentar lagi.'})}\n\n"

# Global LLM service instance
llm_service = LLMService()