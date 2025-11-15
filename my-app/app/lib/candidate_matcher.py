#!/usr/bin/env python3
"""
run this: python3 app/lib/candidate_matcher.py find_similar app/models/candidate_matcher_id_only.pkl

Candidate Similarity Matcher (ID-Only Version)
===============================================
Find similar candidates based purely on skill profiles.
No company data - just IDs and skills.

Usage:
    # Train
    model = CandidateMatcher()
    model.add_candidate('student_001', skills={'systems_infrastructure': 12.0, ...})
    model.fit()
    model.save('matcher.pkl')
    
    # Use
    model = CandidateMatcher.load('matcher.pkl')
    matches = model.find_similar(new_candidate_skills, top_k=5)
"""

import numpy as np
import pickle
import json
import sys
import os
from datetime import datetime

import numpy as np

# Lightweight StandardScaler replacement using only numpy
class SimpleScaler:
    """Minimal StandardScaler replacement using only numpy"""
    def __init__(self):
        self.mean_ = None
        self.scale_ = None
        self.n_features_in_ = None
    
    def fit(self, X):
        """Compute mean and standard deviation for scaling"""
        X = np.array(X)
        self.n_features_in_ = X.shape[1]
        self.mean_ = np.mean(X, axis=0)
        self.scale_ = np.std(X, axis=0)
        # Avoid division by zero
        self.scale_[self.scale_ == 0] = 1.0
        return self
    
    def transform(self, X):
        """Scale features using computed mean and std"""
        X = np.array(X)
        return (X - self.mean_) / self.scale_

# Lightweight distance functions using numpy only (no scipy)
def euclidean_distance(a, b):
    """Calculate Euclidean distance using numpy only."""
    return np.sqrt(np.sum((np.array(a) - np.array(b)) ** 2))

def cosine_distance(a, b):
    """Calculate cosine distance using numpy only."""
    a, b = np.array(a), np.array(b)
    dot_product = np.dot(a, b)
    norms = np.linalg.norm(a) * np.linalg.norm(b)
    if norms == 0:
        return 1.0  # Maximum distance for zero vectors
    return 1 - (dot_product / norms)


class CandidateMatcher:
    """
    Find similar candidates based on skill profiles.
    Uses k-nearest neighbors in normalized skill space.
    """
    
    VERSION = "2.0.0"
    
    def __init__(self):
        self.candidates = []
        self.skill_matrix = None
        self.scaler = SimpleScaler()
        self.skill_dims = ['systems_infrastructure', 'theory_statistics_ml', 'product', 'github_similarity']
        self.normalized_dims = ['systems_infrastructure', 'theory_statistics_ml', 'product']  # Exclude GitHub
        self.raw_dims = ['github_similarity']  # Keep GitHub raw (already 0-1)
        self.fitted = False
        
    def add_candidate(self, candidate_id, skills):
        """
        Add a candidate to the database.
        
        Args:
            candidate_id: unique identifier (e.g., "student_001", "C1")
            skills: dict with keys: systems_infrastructure, theory_statistics_ml, product
        """
        self.candidates.append({
            'id': candidate_id,
            'skills': skills
        })
        self.fitted = False  # Need to retrain
        
    def add_candidates_bulk(self, candidates_list):
        """
        Add multiple candidates at once.
        
        Args:
            candidates_list: list of dicts with 'id' and 'skills' keys
            
        Example:
            candidates = [
                {'id': 'C1', 'skills': {'systems_infrastructure': 12.0, ...}},
                {'id': 'C2', 'skills': {'systems_infrastructure': 14.5, ...}},
            ]
            model.add_candidates_bulk(candidates)
        """
        for candidate in candidates_list:
            self.add_candidate(candidate['id'], candidate['skills'])
    
    def fit(self):
        """Build the similarity index from added candidates."""
        if len(self.candidates) < 2:
            raise ValueError("Need at least 2 candidates to build model")
        
        # Create skill matrix - handle missing dimensions gracefully
        self.skill_matrix = np.array([
            [c['skills'].get(dim, 0.0) for dim in self.skill_dims]
            for c in self.candidates
        ])
        
        # Create normalized matrix (only first 3 dimensions)
        self.normalized_matrix = np.array([
            [c['skills'].get(dim, 0.0) for dim in self.normalized_dims]
            for c in self.candidates
        ])
        
        # Fit scaler only on normalized dimensions (create new one to avoid conflicts)
        self.scaler = SimpleScaler()
        self.scaler.fit(self.normalized_matrix)
        
        self.fitted = True
        return self
    
    def find_similar(self, query_skills, top_k=5, metric='euclidean', weights=None):
        """
        Find most similar candidates to the query.
        
        Args:
            query_skills: dict with systems_infrastructure, theory_statistics_ml, product
            top_k: number of similar candidates to return
            metric: 'euclidean' or 'cosine'
            weights: dict with category weights (default: equal weights of 1.0)
            
        Returns:
            list of dicts with candidate info and similarity scores
        """
        if not self.fitted:
            self.fit()
        
        # Default to equal weights if not provided
        if weights is None:
            weights = {'systems_infrastructure': 1.0, 'theory_statistics_ml': 1.0, 'product': 1.0, 'github_similarity': 1.0}
        
        # Normalize weights to sum to 4.0 (to maintain average weight of 1.0)
        total_weight = (weights.get('systems_infrastructure', 1.0) + 
                       weights.get('theory_statistics_ml', 1.0) + 
                       weights.get('product', 1.0) + 
                       weights.get('github_similarity', 1.0))
        normalized_weights = {
            'systems_infrastructure': (weights.get('systems_infrastructure', 1.0) / total_weight) * 4.0,
            'theory_statistics_ml': (weights.get('theory_statistics_ml', 1.0) / total_weight) * 4.0,
            'product': (weights.get('product', 1.0) / total_weight) * 4.0,
            'github_similarity': (weights.get('github_similarity', 1.0) / total_weight) * 4.0
        }
        
        # Split query into normalized and raw parts
        query_normalized = np.array([[
            query_skills['systems_infrastructure'],
            query_skills['theory_statistics_ml'],
            query_skills['product']
        ]])
        query_raw = np.array([query_skills.get('github_similarity', 0.0)])
        
        # Calculate similarities per candidate using only available dimensions
        results = []
        for i, candidate in enumerate(self.candidates):
            candidate_skills = candidate['skills']
            
            # Determine what type of data the query candidate has
            query_has_skills = any(query_skills.get(dim, 0.0) > 0 for dim in ['systems_infrastructure', 'theory_statistics_ml', 'product'])
            query_has_github = query_skills.get('github_similarity', 0.0) > 0
            
            available_dims = []
            query_values = []
            candidate_values = []
            weights_for_comparison = []
            academic_data_available = []
            
            if query_has_skills and query_has_github:
                # Query has both - compare along all 4 dimensions
                comparison_dims = ['systems_infrastructure', 'theory_statistics_ml', 'product', 'github_similarity']
            elif query_has_skills:
                # Query has only skills - compare along skills only
                comparison_dims = ['systems_infrastructure', 'theory_statistics_ml', 'product']
            elif query_has_github:
                # Query has only github - compare along github only
                comparison_dims = ['github_similarity']
            else:
                # Query has no data - skip this candidate
                comparison_dims = []
            
            # Process academic dimensions if included
            for dim in ['systems_infrastructure', 'theory_statistics_ml', 'product']:
                if dim in comparison_dims:
                    query_val = query_skills.get(dim, 0.0)
                    candidate_val = candidate_skills.get(dim, 0.0)
                    available_dims.append(dim)
                    academic_data_available.append((query_val, candidate_val))
                    weights_for_comparison.append(normalized_weights[dim])
            
            # Process GitHub dimension if included
            if 'github_similarity' in comparison_dims:
                query_github = query_skills.get('github_similarity', 0.0)
                candidate_github = candidate_skills.get('github_similarity', 0.0)
                available_dims.append('github_similarity')
                weights_for_comparison.append(normalized_weights['github_similarity'])
                
                # GitHub values go directly (no normalization)
                query_values.append(query_github)
                candidate_values.append(candidate_github)
            
            # Normalize academic values if we have any
            if academic_data_available:
                # Create matrices for normalization - need to pad to 3 dimensions for scaler
                # Build full 3D vectors with 0s for missing dimensions
                query_full_academic = [0.0, 0.0, 0.0]
                candidate_full_academic = [0.0, 0.0, 0.0]
                
                # Map available academic dimensions to their positions
                dim_map = {'systems_infrastructure': 0, 'theory_statistics_ml': 1, 'product': 2}
                academic_indices = []
                
                for j, dim in enumerate(['systems_infrastructure', 'theory_statistics_ml', 'product']):
                    if dim in [d for d in available_dims if d != 'github_similarity']:
                        # Find this dimension in our academic_data_available
                        for k, avail_dim in enumerate([d for d in available_dims if d != 'github_similarity']):
                            if avail_dim == dim:
                                query_full_academic[j] = academic_data_available[k][0]
                                candidate_full_academic[j] = academic_data_available[k][1]
                                academic_indices.append(j)
                                break
                
                # Apply scaler to full vectors
                query_academic_scaled = self.scaler.transform([query_full_academic])[0]
                candidate_academic_scaled = self.scaler.transform([candidate_full_academic])[0]
                
                # Extract only the indices we actually use
                query_academic_values = [query_academic_scaled[i] for i in academic_indices]
                candidate_academic_values = [candidate_academic_scaled[i] for i in academic_indices]
                
                # Add normalized academic values to our comparison arrays
                query_values = query_academic_values + query_values
                candidate_values = candidate_academic_values + candidate_values
            
            # Skip this candidate if no shared dimensions
            if len(available_dims) == 0:
                similarity = 0.0
                distance = float('inf')
            else:
                # Renormalize weights for available dimensions only
                total_available_weight = sum(weights_for_comparison)
                if total_available_weight > 0:
                    normalized_available_weights = [w / total_available_weight * len(weights_for_comparison) for w in weights_for_comparison]
                else:
                    normalized_available_weights = [1.0] * len(weights_for_comparison)
                
                # Apply weights
                query_weighted = [q * w for q, w in zip(query_values, normalized_available_weights)]
                candidate_weighted = [c * w for c, w in zip(candidate_values, normalized_available_weights)]
                
                # Calculate distance
                if metric == 'euclidean':
                    distance = euclidean_distance(query_weighted, candidate_weighted)
                    similarity = 1 / (1 + distance)  # Convert to similarity (0-1)
                elif metric == 'cosine':
                    distance = cosine_distance(query_weighted, candidate_weighted)
                    similarity = 1 - distance  # Cosine similarity
                else:
                    raise ValueError(f"Unknown metric: {metric}")
            
            results.append({
                'candidate_id': candidate['id'],
                'distance': distance,
                'similarity': similarity,
                'similarity_percentage': similarity * 100,
                'skills': candidate['skills'].copy(),
                'skill_differences': {
                    dim: query_skills.get(dim, 0.0) - candidate['skills'].get(dim, 0.0)
                    for dim in available_dims  # Only show differences for dimensions actually used
                },
                'available_dimensions': available_dims,  # Track which dimensions were used
                'dimensions_used_count': len(available_dims),
                'weighted_skills': {
                    dim: candidate['skills'].get(dim, 0.0) * normalized_weights.get(dim, 0.0)
                    for dim in available_dims  # Only show weights for used dimensions
                },
                'weights_applied': {dim: normalized_weights.get(dim, 0.0) for dim in available_dims}
            })
        
        # Sort by similarity (highest first)
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return results[:top_k]
    
    def get_database_size(self):
        """Return number of candidates in database."""
        return len(self.candidates)
    
    def save(self, filepath):
        """Save the model to disk."""
        if not self.fitted and len(self.candidates) >= 2:
            self.fit()
        
        model_data = {
            'version': self.VERSION,
            'candidates': self.candidates,
            'saved_at': datetime.now().isoformat()
        }
        
        # Only include scaler data if model is fitted
        if self.fitted:
            model_data['scaler_mean'] = self.scaler.mean_.tolist()
            model_data['scaler_scale'] = self.scaler.scale_.tolist()
        else:
            model_data['scaler_mean'] = []
            model_data['scaler_scale'] = []
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        return True
    
    @classmethod
    def load(cls, filepath):
        """Load a saved model from disk."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        # Reconstruct model
        model = cls()
        model.candidates = model_data['candidates']
        
        # Only reconstruct scaler if the model was fitted when saved
        if model_data.get('scaler_mean') and model_data.get('scaler_scale'):
            model.scaler.mean_ = np.array(model_data['scaler_mean'])
            model.scaler.scale_ = np.array(model_data['scaler_scale'])
            model.scaler.n_features_in_ = 3  # Only normalized dimensions
            
            # Rebuild skill matrix - handle missing dimensions gracefully
            model.skill_matrix = np.array([
                [c['skills'].get(dim, 0.0) for dim in model.skill_dims]
                for c in model.candidates
            ])
            
            # Rebuild normalized matrix - handle missing dimensions gracefully
            model.normalized_matrix = np.array([
                [c['skills'].get(dim, 0.0) for dim in model.normalized_dims]
                for c in model.candidates
            ])
            
            model.fitted = True
        else:
            # Model wasn't fitted when saved (< 2 candidates)
            model.fitted = False
        
        return model


def find_similar_candidates(model_path, query_skills, top_k=5, weights=None, github_similarities=None):
    """
    Load model and find similar candidates. Creates new model if none exists.
    
    Args:
        model_path: path to saved .pkl model
        query_skills: dict with skill scores
        top_k: number of matches to return
        weights: dict with category weights (optional)
        github_similarities: list of GitHub similarity scores from RPC (optional)
        
    Returns:
        dict with matches and metadata
    """
    try:
        # Try to load existing model
        if os.path.exists(model_path):
            model = CandidateMatcher.load(model_path)
        else:
            # Create new empty model if none exists
            model = CandidateMatcher()
            # Ensure directory exists
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # If model has fewer than 2 candidates, return empty matches
        if model.get_database_size() < 2:
            return {
                'success': True,
                'matches': [],
                'database_size': model.get_database_size(),
                'query_skills': query_skills,
                'message': 'Not enough candidates in database for similarity matching'
            }
        
        # Apply GitHub similarities to candidates if provided
        if github_similarities:
            github_lookup = {str(item['id']): item['similarity'] for item in github_similarities}
            
            # Update candidates with GitHub similarities
            for candidate in model.candidates:
                candidate_id = candidate['id']
                github_sim = github_lookup.get(candidate_id, 0.0)
                candidate['skills']['github_similarity'] = github_sim
            
            # Refit the model with updated GitHub similarities
            if model.get_database_size() >= 2:
                model.fit()
        
        # Find matches
        matches = model.find_similar(query_skills, top_k=top_k, weights=weights)
        
        return {
            'success': True,
            'matches': matches,
            'database_size': model.get_database_size(),
            'query_skills': query_skills,
            'weights_used': weights
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'matches': []
        }


def add_candidate_to_model(model_path, candidate_id, skills):
    """
    Add a new candidate to the model or update existing one and save it.
    
    Args:
        model_path: path to saved .pkl model
        candidate_id: unique identifier for the candidate
        skills: dict with skill scores
        
    Returns:
        dict with success status
    """
    try:
        # Load existing model or create new one
        if os.path.exists(model_path):
            model = CandidateMatcher.load(model_path)
        else:
            model = CandidateMatcher()
            # Ensure directory exists
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Check if candidate already exists
        existing_candidate_index = None
        for i, candidate in enumerate(model.candidates):
            if candidate['id'] == candidate_id:
                existing_candidate_index = i
                break
        
        action_taken = "updated"
        if existing_candidate_index is not None:
            # Update existing candidate's skills
            model.candidates[existing_candidate_index]['skills'] = skills
        else:
            # Add new candidate
            model.add_candidate(candidate_id, skills)
            action_taken = "added"
        
        # Only fit if we have enough candidates, but always save
        if model.get_database_size() >= 2:
            model.fit()
        model.save(model_path)
        
        return {
            'success': True,
            'message': f'{action_taken.capitalize()} candidate {candidate_id} in model',
            'action': action_taken,
            'database_size': model.get_database_size()
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def main():
    """Command line interface for the candidate matcher."""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python candidate_matcher.py <command> [args...]'
        }))
        return
    
    command = sys.argv[1]
    
    if command == 'find_similar':
        if len(sys.argv) < 4 or len(sys.argv) > 5:
            print(json.dumps({
                'success': False,
                'error': 'Usage: python candidate_matcher.py find_similar <model_path> <query_json> [candidate_id_to_add]'
            }))
            return
        
        model_path = sys.argv[2]
        query_json = sys.argv[3]
        candidate_id = sys.argv[4] if len(sys.argv) == 5 else None
        
        try:
            query_data = json.loads(query_json)
            skills = query_data.get('skills', query_data)  # Support both old and new format
            weights = query_data.get('weights', None)
            top_k = query_data.get('top_k', 5)  # Get top_k from JSON, default to 5
            github_similarities = query_data.get('github_similarities', None)  # Get GitHub similarities
            result = find_similar_candidates(model_path, skills, top_k=top_k, weights=weights, github_similarities=github_similarities)
            
            # If candidate_id provided, also add/update in model
            if candidate_id and result['success']:
                add_result = add_candidate_to_model(model_path, candidate_id, skills)
                result['candidate_added'] = add_result['success']
                result['candidate_action'] = add_result.get('action', 'unknown')
                result['database_size'] = add_result.get('database_size', result['database_size'])
                if add_result['success']:
                    result['processed_candidate_id'] = candidate_id
            
            # Print JSON results
            print(json.dumps(result, indent=2))
            
        except json.JSONDecodeError:
            print(json.dumps({
                'success': False,
                'error': 'Invalid JSON for skills'
            }))
    
    elif command == 'add_candidate':
        if len(sys.argv) != 5:
            print(json.dumps({
                'success': False,
                'error': 'Usage: python candidate_matcher.py add_candidate <model_path> <candidate_id> <skills_json>'
            }))
            return
        
        model_path = sys.argv[2]
        candidate_id = sys.argv[3]
        skills_json = sys.argv[4]
        
        try:
            skills = json.loads(skills_json)
            result = add_candidate_to_model(model_path, candidate_id, skills)
            print(json.dumps(result))
        except json.JSONDecodeError:
            print(json.dumps({
                'success': False,
                'error': 'Invalid JSON for skills'
            }))
    
    else:
        print(json.dumps({
            'success': False,
            'error': f'Unknown command: {command}'
        }))


if __name__ == "__main__":
    main()