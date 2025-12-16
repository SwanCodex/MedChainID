from flask import Flask, request, jsonify
from flask_cors import CORS
from model import detect_anomaly, analyze_document_risk
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'ML Engine is running',
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze a medical document for anomalies and fraud risk
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract features from the request
        document_hash = data.get('documentHash', '')
        record_type = data.get('recordType', '')
        file_size = data.get('fileSize', 0)
        issuer = data.get('issuer', '')
        
        # Run anomaly detection
        is_anomalous, confidence, reason = detect_anomaly({
            'document_hash': document_hash,
            'record_type': record_type,
            'file_size': file_size,
            'issuer': issuer
        })
        
        # Calculate risk score
        risk_score = analyze_document_risk({
            'is_anomalous': is_anomalous,
            'confidence': confidence,
            'file_size': file_size,
            'record_type': record_type
        })
        
        return jsonify({
            'success': True,
            'data': {
                'is_anomalous': is_anomalous,
                'confidence': confidence,
                'reason': reason,
                'risk_score': risk_score,
                'risk_level': get_risk_level(risk_score),
                'recommendations': get_recommendations(risk_score, is_anomalous)
            }
        })
        
    except Exception as e:
        print(f"Error in analyze: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-medicine', methods=['POST'])
def verify_medicine():
    """
    Verify if medicine report shows signs of counterfeiting
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        medicine_name = data.get('medicineName', '')
        batch_number = data.get('batchNumber', '')
        manufacturer = data.get('manufacturer', '')
        
        # Simple heuristic-based verification (in production, use ML model)
        is_suspicious = False
        reasons = []
        
        # Check for common counterfeit patterns
        if len(batch_number) < 5:
            is_suspicious = True
            reasons.append('Batch number too short')
        
        if not manufacturer or len(manufacturer) < 3:
            is_suspicious = True
            reasons.append('Invalid manufacturer name')
        
        confidence = 0.85 if not is_suspicious else 0.45
        
        return jsonify({
            'success': True,
            'data': {
                'is_legitimate': not is_suspicious,
                'confidence': confidence,
                'reasons': reasons if is_suspicious else ['No suspicious patterns detected'],
                'recommendation': 'Approved' if not is_suspicious else 'Requires manual verification'
            }
        })
        
    except Exception as e:
        print(f"Error in verify_medicine: {str(e)}")
        return jsonify({'error': str(e)}), 500

def get_risk_level(risk_score):
    """Convert numerical risk score to categorical level"""
    if risk_score < 0.3:
        return 'LOW'
    elif risk_score < 0.6:
        return 'MEDIUM'
    else:
        return 'HIGH'

def get_recommendations(risk_score, is_anomalous):
    """Generate recommendations based on risk assessment"""
    recommendations = []
    
    if risk_score < 0.3:
        recommendations.append('Document appears legitimate. Safe to process.')
    elif risk_score < 0.6:
        recommendations.append('Document shows minor irregularities. Recommend secondary verification.')
    else:
        recommendations.append('High risk detected. Manual review required.')
    
    if is_anomalous:
        recommendations.append('Anomaly detected in document patterns.')
        recommendations.append('Cross-reference with issuer\'s historical records.')
    
    return recommendations

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('DEBUG', 'True') == 'True'
    
    print(f"🤖 MedChainID ML Engine")
    print(f"🚀 Starting server on port {port}")
    print(f"🐛 Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
