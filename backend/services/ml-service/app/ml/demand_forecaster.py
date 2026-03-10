"""
Demand forecasting model using time series analysis
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from loguru import logger
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pickle
import os


class DemandForecaster:
    """Emergency demand forecasting model"""
    
    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(model_dir, exist_ok=True)
        
        # Try to load existing model
        self.load_model()
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features from historical data"""
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Time-based features
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['day_of_month'] = df['timestamp'].dt.day
        df['month'] = df['timestamp'].dt.month
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Rush hour features
        df['is_morning_rush'] = df['hour'].isin([7, 8, 9]).astype(int)
        df['is_evening_rush'] = df['hour'].isin([17, 18, 19]).astype(int)
        
        # Night time
        df['is_night'] = df['hour'].isin(list(range(0, 6)) + list(range(22, 24))).astype(int)
        
        # Cyclical encoding for time features
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        return df
    
    async def train(self, historical_data: List[Dict], min_samples: int = 100) -> Dict:
        """Train the demand forecasting model"""
        try:
            if len(historical_data) < min_samples:
                raise ValueError(f"Insufficient data for training. Need at least {min_samples} samples.")
            
            logger.info(f"Training demand forecaster with {len(historical_data)} samples")
            
            # Convert to DataFrame
            df = pd.DataFrame(historical_data)
            df = self.prepare_features(df)
            
            # Feature columns
            feature_cols = [
                'hour', 'day_of_week', 'day_of_month', 'month',
                'is_weekend', 'is_morning_rush', 'is_evening_rush', 'is_night',
                'hour_sin', 'hour_cos', 'day_sin', 'day_cos'
            ]
            
            X = df[feature_cols].values
            y = df['demand_count'].values
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train Random Forest model
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            
            start_time = datetime.now()
            self.model.fit(X_scaled, y)
            training_time = (datetime.now() - start_time).total_seconds()
            
            # Calculate training accuracy (R² score)
            train_score = self.model.score(X_scaled, y)
            
            self.is_trained = True
            
            # Save model
            self.save_model()
            
            logger.info(f"Model trained successfully. R² score: {train_score:.4f}")
            
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
    
    def predict(self, timestamp: datetime) -> Tuple[float, float]:
        """Predict demand for a specific timestamp"""
        if not self.is_trained:
            raise ValueError("Model not trained. Please train the model first.")
        
        # Create feature vector
        features = {
            'timestamp': timestamp,
            'demand_count': 0  # Placeholder
        }
        df = pd.DataFrame([features])
        df = self.prepare_features(df)
        
        feature_cols = [
            'hour', 'day_of_week', 'day_of_month', 'month',
            'is_weekend', 'is_morning_rush', 'is_evening_rush', 'is_night',
            'hour_sin', 'hour_cos', 'day_sin', 'day_cos'
        ]
        
        X = df[feature_cols].values
        X_scaled = self.scaler.transform(X)
        
        # Predict
        prediction = self.model.predict(X_scaled)[0]
        
        # Calculate confidence based on feature importance and variance
        # For Random Forest, we can use prediction variance across trees
        predictions_per_tree = np.array([tree.predict(X_scaled)[0] for tree in self.model.estimators_])
        std_dev = np.std(predictions_per_tree)
        
        # Confidence: lower std_dev = higher confidence
        # Normalize to 0-1 range
        confidence = max(0.5, 1.0 - (std_dev / max(prediction, 1)))
        
        return max(0, prediction), min(1.0, confidence)
    
    def predict_batch(self, timestamps: List[datetime]) -> List[Tuple[float, float]]:
        """Predict demand for multiple timestamps"""
        return [self.predict(ts) for ts in timestamps]
    
    def forecast(self, start_time: datetime, hours: int = 24) -> List[Dict]:
        """Forecast demand for next N hours"""
        predictions = []
        
        for i in range(hours):
            timestamp = start_time + timedelta(hours=i)
            predicted_demand, confidence = self.predict(timestamp)
            
            predictions.append({
                "timestamp": timestamp,
                "predicted_count": round(predicted_demand, 2),
                "confidence": round(confidence, 2)
            })
        
        return predictions
    
    def save_model(self):
        """Save model to disk"""
        try:
            model_path = os.path.join(self.model_dir, "demand_forecaster.pkl")
            scaler_path = os.path.join(self.model_dir, "demand_scaler.pkl")
            
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            
            with open(scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            logger.info(f"Model saved to {model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def load_model(self):
        """Load model from disk"""
        try:
            model_path = os.path.join(self.model_dir, "demand_forecaster.pkl")
            scaler_path = os.path.join(self.model_dir, "demand_scaler.pkl")
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                
                self.is_trained = True
                logger.info("Model loaded from disk")
            else:
                logger.info("No saved model found")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")


# Global forecaster instance
forecaster = DemandForecaster()
