import io
import os
import re
import json
import cv2
import numpy as np
import pytesseract
from PIL import Image
import google.generativeai as genai
from typing import Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

# Gemini configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ... imports ...

# Tesseract Configuration
# FIX: Do not hardcode Windows paths for production.
# Check if running on Windows, otherwise trust system PATH.
if os.name == 'nt':
    # Only set specific path if on Windows and default is missing
    possible_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(possible_path):
        pytesseract.pytesseract.tesseract_cmd = possible_path
else:
    # On Linux/Docker, tesseract is usually in /usr/bin/tesseract (in PATH)
    pass 

# ... rest of the file ...

# --------------------------------------------------
# IMAGE PRE-PROCESSING (OCR IMPROVEMENT)
# --------------------------------------------------
def preprocess_image(file_buffer: bytes):
    image = Image.open(io.BytesIO(file_buffer))
    img = np.array(image)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    thresh = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11,
        2
    )
    return thresh


# --------------------------------------------------
# PII REDACTION (PRIVACY LAYER)
# --------------------------------------------------
def redact_pii(text: str) -> str:
    patterns = {
        "PHONE": r"\b\d{10}\b",
        "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        "AADHAR": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "DOB": r"\b\d{2}/\d{2}/\d{4}\b"
    }

    for label, pattern in patterns.items():
        text = re.sub(pattern, f"[REDACTED_{label}]", text)

    return text


# --------------------------------------------------
# OFFLINE FALLBACK VERIFICATION
# --------------------------------------------------
def local_keyword_check(text: str, record_type: str) -> bool:
    keyword_map = {
        "Medicine Report": ["tablet", "mg", "batch", "expiry", "manufacturer"],
        "Birth Certificate": ["birth", "date", "father", "mother"],
        "Insurance Claim": ["policy", "claim", "amount", "insured"]
    }

    keywords = keyword_map.get(record_type, [])
    score = sum(1 for k in keywords if k.lower() in text.lower())

    return score >= max(1, len(keywords) // 2)


# --------------------------------------------------
# MAIN VERIFICATION FUNCTION
# --------------------------------------------------
def verify_document_with_ai(file_buffer: bytes, record_type: str):
    try:
        # ---- OCR Stage ----
        processed_img = preprocess_image(file_buffer)
        ocr_text = pytesseract.image_to_string(processed_img)

        if len(ocr_text.strip()) < 5:
            return {
                "verified": False,
                "confidence": 0.0,
                "message": "Document unreadable or empty",
                "risk_flags": ["Low OCR confidence"]
            }

        # ---- Privacy Stage ----
        ocr_text = redact_pii(ocr_text)

        # ---- Gemini AI Stage ----
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
        You are an expert forensic document analyst.

        CLAIMED DOCUMENT TYPE:
        "{record_type}"

        OCR TEXT (PII REDACTED):
        \"\"\"{ocr_text[:3000]}\"\"\"

        TASK:
        - Validate if the document matches the claimed type
        - Ignore OCR spelling errors
        - Identify suspicious patterns

        OUTPUT STRICT JSON:
        {{
            "is_authentic": boolean,
            "confidence": float,
            "summary": "short explanation",
            "risk_flags": ["issues"]
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        analysis = json.loads(response.text)

        return {
            "verified": analysis.get("is_authentic", False),
            "confidence": analysis.get("confidence", 0.0),
            "message": analysis.get("summary", "Verification complete"),
            "risk_flags": analysis.get("risk_flags", [])
        }

    # ---- HYBRID FALLBACK ----
    except Exception as e:
        print(f"Gemini failed: {e}")

        fallback = local_keyword_check(ocr_text, record_type)

        return {
            "verified": fallback,
            "confidence": 0.4,
            "message": "Fallback keyword-based verification used",
            "risk_flags": ["AI unavailable"]
        }


def detect_anomaly(document_data: Dict[str, Any]) -> Tuple[bool, float, str]:
    """

    Detect anomalies in medical documents using simple heuristics.
    In production, this would use a trained ML model.
    
    Args:
        document_data: Dictionary containing document features
        
    Returns:
        Tuple of (is_anomalous, confidence, reason)
    """
    
    file_size = document_data.get('file_size', 0)
    record_type = document_data.get('record_type', '')
    document_hash = document_data.get('document_hash', '')
    
    # Simple heuristic checks
    anomalies = []
    
    # Check 1: File size anomalies
    if file_size < 1000:  # Less than 1KB
        anomalies.append('File size unusually small')
    elif file_size > 50 * 1024 * 1024:  # Greater than 50MB
        anomalies.append('File size unusually large')
    
    # Check 2: Hash pattern analysis (very basic)
    if len(document_hash) != 64:  # SHA-256 should be 64 hex chars
        anomalies.append('Invalid hash format')
    
    # Check 3: Record type validation
    valid_types = ['Insurance Claim', 'Birth Certificate', 'Medicine Report', 'Other']
    if record_type not in valid_types:
        anomalies.append('Invalid record type')
    
    # Calculate confidence based on number of anomalies
    is_anomalous = len(anomalies) > 0
    confidence = 1.0 - (len(anomalies) * 0.25)  # Reduce confidence for each anomaly
    confidence = max(0.1, min(1.0, confidence))
    
    reason = '; '.join(anomalies) if anomalies else 'No anomalies detected'
    
    return is_anomalous, confidence, reason

def analyze_document_risk(features: Dict[str, Any]) -> float:
    """
    Calculate a risk score for the document (0.0 to 1.0)
    
    Args:
        features: Dictionary containing document features
        
    Returns:
        Risk score between 0.0 (low risk) and 1.0 (high risk)
    """
    
    risk_score = 0.0
    
    # Factor 1: Anomaly detection result
    if features.get('is_anomalous', False):
        risk_score += 0.4
    
    # Factor 2: Confidence level (inverse)
    confidence = features.get('confidence', 1.0)
    risk_score += (1.0 - confidence) * 0.3
    
    # Factor 3: File size risks
    file_size = features.get('file_size', 0)
    if file_size < 1000 or file_size > 50 * 1024 * 1024:
        risk_score += 0.2
    
    # Factor 4: Record type specific risks
    record_type = features.get('record_type', '')
    high_risk_types = ['Insurance Claim', 'Medicine Report']
    if record_type in high_risk_types:
        risk_score += 0.1
    
    # Normalize to [0, 1]
    risk_score = min(1.0, max(0.0, risk_score))
    
    return round(risk_score, 2)

def train_anomaly_model(training_data: list) -> Dict[str, Any]:
    """
    Placeholder for training an actual ML model.
    In production, this would train an Isolation Forest or similar model.
    
    Args:
        training_data: List of training examples
        
    Returns:
        Trained model (currently just returns placeholder)
    """
    
    # This is where you would implement actual ML training
    # Example: Use sklearn's IsolationForest
    
    print("⚠️  Note: Using heuristic-based detection.")
    print("For production, implement proper ML model training here.")
    
    return {
        'model_type': 'heuristic',
        'version': '1.0',
        'trained': False
    }

def evaluate_medicine_authenticity(medicine_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate if a medicine report is authentic or potentially counterfeit.
    
    Args:
        medicine_data: Dictionary containing medicine information
        
    Returns:
        Dictionary with authenticity assessment
    """
    
    batch_number = medicine_data.get('batch_number', '')
    manufacturer = medicine_data.get('manufacturer', '')
    expiry_date = medicine_data.get('expiry_date', '')
    
    risk_factors = []
    
    # Check batch number format
    if len(batch_number) < 5:
        risk_factors.append('Batch number format suspicious')
    
    # Check manufacturer
    if not manufacturer or len(manufacturer) < 3:
        risk_factors.append('Invalid manufacturer')
    
    # Calculate authenticity score
    authenticity_score = 1.0 - (len(risk_factors) * 0.3)
    authenticity_score = max(0.0, min(1.0, authenticity_score))
    
    return {
        'is_authentic': authenticity_score > 0.5,
        'confidence': authenticity_score,
        'risk_factors': risk_factors,
        'recommendation': 'Approved' if authenticity_score > 0.7 else 'Manual review required'
    }

# Feature extraction utilities

def extract_document_features(file_path: str) -> Dict[str, Any]:
    """
    Extract features from a document file for ML analysis.
    
    Args:
        file_path: Path to the document file
        
    Returns:
        Dictionary of extracted features
    """
    
    import os
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Extract basic features
    file_size = os.path.getsize(file_path)
    file_extension = os.path.splitext(file_path)[1]
    
    # In production, extract more sophisticated features:
    # - Text content analysis
    # - Image features (if applicable)
    # - Metadata analysis
    # - Pattern recognition
    
    return {
        'file_size': file_size,
        'file_extension': file_extension,
        'has_images': False,  # Placeholder
        'text_length': 0,     # Placeholder
    }

if __name__ == '__main__':
    # Test the anomaly detection
    print("Testing anomaly detection...")
    
    test_doc = {
        'document_hash': 'a' * 64,
        'record_type': 'Insurance Claim',
        'file_size': 50000,
        'issuer': '0x123'
    }
    
    is_anom, conf, reason = detect_anomaly(test_doc)
    print(f"Anomalous: {is_anom}, Confidence: {conf}, Reason: {reason}")
    
    risk = analyze_document_risk({
        'is_anomalous': is_anom,
        'confidence': conf,
        'file_size': 50000,
        'record_type': 'Insurance Claim'
    })
    print(f"Risk Score: {risk}")
