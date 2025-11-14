#!/usr/bin/env python3
"""
Safe model inspection script - READ ONLY
"""
import pickle
import sys
import os

def inspect_model(model_path):
    """Safely inspect model without modifying it"""
    if not os.path.exists(model_path):
        return {
            'exists': False,
            'error': 'Model file does not exist'
        }
    
    try:
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        candidates = model_data.get('candidates', [])
        
        # Get candidate IDs and sample data
        candidate_info = []
        for candidate in candidates[:5]:  # Show first 5 candidates
            candidate_info.append({
                'id': candidate.get('id', 'unknown'),
                'skills': list(candidate.get('skills', {}).keys()),
                'sample_skill_values': {k: v for k, v in list(candidate.get('skills', {}).items())[:3]}
            })
        
        return {
            'exists': True,
            'total_candidates': len(candidates),
            'version': model_data.get('version', 'unknown'),
            'saved_at': model_data.get('saved_at', 'unknown'),
            'sample_candidates': candidate_info,
            'has_scaler_data': bool(model_data.get('scaler_mean') and model_data.get('scaler_scale'))
        }
        
    except Exception as e:
        return {
            'exists': True,
            'error': f'Error loading model: {str(e)}'
        }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python inspect_model.py <model_path>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    result = inspect_model(model_path)
    
    import json
    print(json.dumps(result, indent=2))