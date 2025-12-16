import numpy as np
from typing import Tuple, Dict, Any

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
