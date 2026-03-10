"""
Response time predictor using regression
"""

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple
from datetime import datetime
from loguru import logger
import pickle
import os


class ResponseTimePredictor:
    """Predict emergency response times"""
    
    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        os.makedirs(model_dir, exist_ok=True)
        self.load_model()
    
    async def train(self, historical_data: List[Dict], min_samples: int = 50) -> Dict:
        """Train response time prediction model"""
        try:
            if len(historical_data) < min_samples:
                raise ValueError(f"Insufficient data. Need at least {min_samples} samples.")
            
            logger.info(f"Training response time predictor with {len(historical_data)} samples")
            
            # Extract features
            features = []
            targets = []
            
            for record in historical_data:
                feature_vector = self._extract_features(record)
                features.append(feature_vector)
                targets.append(record['response_time_minutes'])
            
            X = np.array(features)
            y = np.array(targets)
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            
            start_time = datetime.now()
            self.model.fit(X_scaled, y)
            training_time = (datetime.now() - start_time).total_seconds()
            
            # Calculate accuracy
            train_score = self.model.score(X_scaled, y)
            
            self.is_trained = True
            self.save_model()
            
            logger.info(f"Response time model trained. R² score: {train_score:.4f}")
            
            return {
                "status": "success",
                "accuracy": train_score,
                "samples_used": len(historical_data),
                "training_time_seconds": training_time,
                "last_trained": datetime.now()
            }
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def predict(self, emergency_data: Dict) -> Tuple[float, float, Dict]:
        """Predict response time for an emergency"""
        if not self.is_trained:
            # Return default estimate if not trained
            return 8.0, 0.6, {"traffic": 0.3, "distance": 0.5, "time_of_day": 0.2}
        
        features = self._extract_features(emergency_data)
        X = np.array([features])
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate confidence (simplified)
        confidence = 0.75  # Could be improved with prediction intervals
        
        # Feature importance (factors affecting response time)
        factors = {
            "traffic": 0.35,
            "distance": 0.40,
            "time_of_day": 0.15,
            "severity": 0.10
        }
        
        return max(0, prediction), confidence, factors
    
    def _extract_features(self, data: Dict) -> List[float]:
        """Extract feature vector from emergency data"""
        # Time features
        hour = data.get('hour', datetime.now().hour)
        is_rush_hour = 1 if hour in [7, 8, 9, 17, 18, 19] else 0
        is_night = 1 if hour < 6 or hour >= 22 else 0
        is_weekend = data.get('is_weekend', 0)
        
        # Location features
        distance_km = data.get('distance_km', 5.0)
        
        # Emergency features
        severity_map = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
        severity_score = severity_map.get(data.get('severity', 'medium'), 1)
        
        # Traffic features
        traffic_level = data.get('traffic_level', 1.0)  # 1.0 = normal, 2.0 = heavy
        
        return [
            hour,
            is_rush_hour,
            is_night,
            is_weekend,
            distance_km,
            severity_score,
            traffic_level
        ]
    
    def save_model(self):
        """Save model to disk"""
        try:
            model_path = os.path.join(self.model_dir, "response_time_predictor.pkl")
            scaler_path = os.path.join(self.model_dir, "response_time_scaler.pkl")
            
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            logger.info("Response time model saved")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def load_model(self):
        """Load model from disk"""
        try:
            model_path = os.path.join(self.model_dir, "response_time_predictor.pkl")
            scaler_path = os.path.join(self.model_dir, "response_time_scaler.pkl")
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                self.is_trained = True
                logger.info("Response time model loaded")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")


# Global predictor instance
response_predictor = ResponseTimePredictor()
