#!/usr/bin/env python3
"""
Vercel Python Runtime API for Candidate Similarity Matching
===========================================================

This endpoint uses the existing candidate_matcher.py logic but runs
natively on Vercel's Python runtime instead of being spawned as a subprocess.
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler

# Add the app directory to the path so we can import candidate_matcher
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app', 'lib'))

try:
    from candidate_matcher import find_similar_candidates, add_candidate_to_model
except ImportError as e:
    # Fallback error handling
    def find_similar_candidates(*args, **kwargs):
        return {'success': False, 'error': f'Failed to import candidate_matcher: {e}'}
    
    def add_candidate_to_model(*args, **kwargs):
        return {'success': False, 'error': f'Failed to import candidate_matcher: {e}'}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for similarity calculations."""
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse the JSON body
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract parameters
            skills = request_data.get('skills', {})
            top_k = request_data.get('top_k', 5)
            candidate_id = request_data.get('candidate_id')
            weights = request_data.get('weights')
            github_similarities = request_data.get('github_similarities', [])
            
            # Validate required fields
            if not skills or not isinstance(skills, dict):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Skills object is required with at least one skill dimension'
                }).encode())
                return
            
            # Check if we have at least one valid skill dimension
            academic_skills = ['systems_infrastructure', 'theory_statistics_ml', 'product']
            has_academic_skills = any(isinstance(skills.get(skill), (int, float)) for skill in academic_skills)
            has_github_similarity = isinstance(skills.get('github_similarity'), (int, float))
            
            if not has_academic_skills and not has_github_similarity:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'At least one skill dimension is required (academic skills or github_similarity)'
                }).encode())
                return
            
            # Create normalized skills object with defaults for missing dimensions
            normalized_skills = {
                'systems_infrastructure': skills.get('systems_infrastructure', 0.0),
                'theory_statistics_ml': skills.get('theory_statistics_ml', 0.0),
                'product': skills.get('product', 0.0),
                'github_similarity': skills.get('github_similarity', 0.0)
            }
            
            # Path to the model file - use /tmp for serverless functions
            model_path = '/tmp/candidate_matcher_id_only.pkl'
            
            # Try to copy the existing model to /tmp if it exists locally
            local_model_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'models', 'candidate_matcher_id_only.pkl')
            if os.path.exists(local_model_path) and not os.path.exists(model_path):
                import shutil
                os.makedirs(os.path.dirname(model_path), exist_ok=True)
                shutil.copy2(local_model_path, model_path)
            
            # Find similar candidates
            result = find_similar_candidates(
                model_path, 
                normalized_skills, 
                top_k=top_k, 
                weights=weights, 
                github_similarities=github_similarities
            )
            
            # If candidate_id provided, also add/update in model
            if candidate_id and result['success']:
                add_result = add_candidate_to_model(model_path, candidate_id, normalized_skills)
                result['candidate_added'] = add_result['success']
                result['candidate_action'] = add_result.get('action', 'unknown')
                result['database_size'] = add_result.get('database_size', result['database_size'])
                if add_result['success']:
                    result['processed_candidate_id'] = candidate_id
            
            # Add execution info
            result['runtime'] = 'python'
            result['timestamp'] = json.loads(json.dumps(result.get('timestamp', None))) if result.get('timestamp') else None
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Invalid JSON in request body'
            }).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Internal server error',
                'details': str(e),
                'runtime': 'python'
            }).encode())
    
    def do_GET(self):
        """Handle GET requests with usage information."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'message': 'Python runtime similarity endpoint',
            'runtime': 'python',
            'usage': {
                'method': 'POST',
                'body': {
                    'skills': {
                        'systems_infrastructure': 'number (optional, academic skills)',
                        'theory_statistics_ml': 'number (optional, academic skills)',
                        'product': 'number (optional, academic skills)',
                        'github_similarity': 'number (optional, 0-1, technical skills)',
                        'note': 'At least one skill dimension (academic or github) is required'
                    },
                    'top_k': 'number (optional, default: 5)',
                    'candidate_id': 'string (optional, adds candidate to model)',
                    'weights': {
                        'systems_infrastructure': 'number (optional, default: 1.0)',
                        'theory_statistics_ml': 'number (optional, default: 1.0)',
                        'product': 'number (optional, default: 1.0)',
                        'github_similarity': 'number (optional, default: 1.0)'
                    }
                }
            }
        }).encode())