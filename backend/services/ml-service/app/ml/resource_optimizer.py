"""
Resource allocation optimizer using constraint optimization
"""

import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime
from loguru import logger
from scipy.spatial.distance import cdist


class ResourceOptimizer:
    """Optimize ambulance resource allocation"""
    
    def __init__(self):
        self.coverage_radius_km = 10.0  # Ideal coverage radius
    
    def calculate_distance(self, loc1: Tuple[float, float], loc2: Tuple[float, float]) -> float:
        """Calculate Haversine distance between two points"""
        lat1, lon1 = np.radians(loc1)
        lat2, lon2 = np.radians(loc2)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return 6371 * c  # Earth radius in km
    
    def calculate_coverage(
        self,
        ambulances: List[Dict],
        demand_points: List[Tuple[float, float]]
    ) -> float:
        """Calculate coverage score (0-1) for current ambulance positions"""
        if not ambulances or not demand_points:
            return 0.0
        
        ambulance_positions = np.array([
            [amb['latitude'], amb['longitude']] 
            for amb in ambulances
        ])
        
        demand_positions = np.array(demand_points)
        
        # Calculate distance matrix
        distances = cdist(
            demand_positions,
            ambulance_positions,
            metric=lambda u, v: self.calculate_distance(
                (u[0], u[1]),
                (v[0], v[1])
            )
        )
        
        # For each demand point, find nearest ambulance
        min_distances = np.min(distances, axis=1)
        
        # Coverage score: percentage of points within ideal radius
        covered = np.sum(min_distances <= self.coverage_radius_km)
        coverage = covered / len(demand_points)
        
        return float(coverage)
    
    def find_optimal_positions(
        self,
        current_ambulances: List[Dict],
        predicted_demand: List[Dict],
        max_repositions: int = 5
    ) -> List[Dict]:
        """Find optimal ambulance positions based on predicted demand"""
        try:
            if not predicted_demand:
                logger.warning("No predicted demand data")
                return []
            
            # Extract high-demand locations
            demand_points = [
                (d['latitude'], d['longitude'])
                for d in predicted_demand
                if d.get('intensity', 0) > 0.5  # High demand threshold
            ]
            
            if not demand_points:
                logger.info("No high-demand areas identified")
                return []
            
            # Calculate current coverage
            current_coverage = self.calculate_coverage(current_ambulances, demand_points)
            
            logger.info(f"Current coverage: {current_coverage:.2%}")
            
            recommendations = []
            
            # Identify ambulances that could be repositioned
            available_ambulances = [
                amb for amb in current_ambulances
                if amb.get('status') == 'available'
            ]
            
            # Use K-means-like approach to find optimal positions
            demand_clusters = self._cluster_demand_points(demand_points, k=len(available_ambulances))
            
            # For each available ambulance, recommend position at cluster centroid
            for i, ambulance in enumerate(available_ambulances[:max_repositions]):
                if i >= len(demand_clusters):
                    break
                
                cluster = demand_clusters[i]
                centroid = np.mean(cluster, axis=0)
                
                current_loc = (ambulance['latitude'], ambulance['longitude'])
                optimal_loc = (centroid[0], centroid[1])
                
                distance_to_move = self.calculate_distance(current_loc, optimal_loc)
                
                # Only recommend if significant improvement
                if distance_to_move > 1.0:  # More than 1km
                    # Estimate demand at optimal location
                    nearby_demand = sum(
                        1 for point in demand_points
                        if self.calculate_distance(optimal_loc, point) <= self.coverage_radius_km
                    )
                    
                    recommendations.append({
                        "ambulance_id": ambulance['id'],
                        "current_location": {
                            "latitude": ambulance['latitude'],
                            "longitude": ambulance['longitude']
                        },
                        "recommended_location": {
                            "latitude": float(centroid[0]),
                            "longitude": float(centroid[1])
                        },
                        "reason": f"High demand area with {nearby_demand} predicted emergencies nearby",
                        "priority": 10 - i,  # Higher for first recommendations
                        "estimated_demand": float(nearby_demand)
                    })
            
            # Calculate improved coverage with recommendations
            if recommendations:
                improved_positions = current_ambulances.copy()
                for rec in recommendations:
                    for amb in improved_positions:
                        if amb['id'] == rec['ambulance_id']:
                            amb['latitude'] = rec['recommended_location']['latitude']
                            amb['longitude'] = rec['recommended_location']['longitude']
                
                improved_coverage = self.calculate_coverage(improved_positions, demand_points)
                logger.info(f"Improved coverage: {improved_coverage:.2%} (+{(improved_coverage - current_coverage):.2%})")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return []
    
    def _cluster_demand_points(self, points: List[Tuple[float, float]], k: int) -> List[np.ndarray]:
        """Simple K-means clustering of demand points"""
        if not points or k <= 0:
            return []
        
        points_array = np.array(points)
        
        # Handle case where k > number of points
        k = min(k, len(points))
        
        # Initialize centroids randomly
        indices = np.random.choice(len(points_array), k, replace=False)
        centroids = points_array[indices]
        
        # K-means iterations
        for _ in range(10):  # Max 10 iterations
            # Assign points to nearest centroid
            distances = cdist(
                points_array,
                centroids,
                metric=lambda u, v: self.calculate_distance((u[0], u[1]), (v[0], v[1]))
            )
            labels = np.argmin(distances, axis=1)
            
            # Update centroids
            new_centroids = np.array([
                points_array[labels == i].mean(axis=0)
                for i in range(k)
            ])
            
            # Check convergence
            if np.allclose(centroids, new_centroids, atol=0.001):
                break
            
            centroids = new_centroids
        
        # Group points by cluster
        clusters = [
            points_array[labels == i]
            for i in range(k)
        ]
        
        return [cluster for cluster in clusters if len(cluster) > 0]


# Global optimizer instance
optimizer = ResourceOptimizer()
