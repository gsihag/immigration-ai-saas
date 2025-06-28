
"""
Performance metrics collection and reporting
"""
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from collections import defaultdict, deque
import threading
import json

logger = logging.getLogger(__name__)

class MetricsCollector:
    """Collect and aggregate application performance metrics"""
    
    def __init__(self):
        self.metrics = defaultdict(list)
        self.counters = defaultdict(int)
        self.response_times = defaultdict(deque)
        self.error_counts = defaultdict(int)
        self.active_users = set()
        self.lock = threading.Lock()
        
        # Keep only last 1000 entries for each metric
        self.max_entries = 1000
    
    def record_request(self, endpoint: str, method: str, response_time: float, status_code: int):
        """Record API request metrics"""
        with self.lock:
            timestamp = datetime.now()
            
            # Record response time
            self.response_times[f"{method}:{endpoint}"].append({
                'time': response_time,
                'timestamp': timestamp.isoformat(),
                'status': status_code
            })
            
            # Maintain max entries
            if len(self.response_times[f"{method}:{endpoint}"]) > self.max_entries:
                self.response_times[f"{method}:{endpoint}"].popleft()
            
            # Count requests
            self.counters[f"requests:{method}:{endpoint}"] += 1
            
            # Count errors
            if status_code >= 400:
                self.error_counts[f"errors:{method}:{endpoint}"] += 1
    
    def record_user_activity(self, user_id: str, activity: str):
        """Record user activity metrics"""
        with self.lock:
            self.active_users.add(user_id)
            self.counters[f"activity:{activity}"] += 1
            
            # Record activity with timestamp
            self.metrics[f"user_activity:{activity}"].append({
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            })
    
    def record_document_upload(self, file_size: int, file_type: str, processing_time: float):
        """Record document upload metrics"""
        with self.lock:
            self.metrics['document_uploads'].append({
                'file_size': file_size,
                'file_type': file_type,
                'processing_time': processing_time,
                'timestamp': datetime.now().isoformat()
            })
            
            self.counters[f"uploads:{file_type}"] += 1
    
    def record_chat_interaction(self, response_time: float, is_ai_response: bool, user_satisfaction: int = None):
        """Record chat system metrics"""
        with self.lock:
            self.metrics['chat_interactions'].append({
                'response_time': response_time,
                'is_ai_response': is_ai_response,
                'user_satisfaction': user_satisfaction,
                'timestamp': datetime.now().isoformat()
            })
            
            if is_ai_response:
                self.counters['ai_responses'] += 1
            else:
                self.counters['human_responses'] += 1
    
    def get_metrics_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get aggregated metrics for the specified time period"""
        with self.lock:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            # Calculate average response times
            avg_response_times = {}
            for endpoint, times in self.response_times.items():
                recent_times = [
                    entry['time'] for entry in times 
                    if datetime.fromisoformat(entry['timestamp']) > cutoff_time
                ]
                if recent_times:
                    avg_response_times[endpoint] = {
                        'avg_ms': round(sum(recent_times) / len(recent_times), 2),
                        'min_ms': round(min(recent_times), 2),
                        'max_ms': round(max(recent_times), 2),
                        'count': len(recent_times)
                    }
            
            # Calculate error rates
            error_rates = {}
            for endpoint in avg_response_times.keys():
                total_requests = self.counters.get(f"requests:{endpoint}", 0)
                total_errors = self.error_counts.get(f"errors:{endpoint}", 0)
                if total_requests > 0:
                    error_rates[endpoint] = round((total_errors / total_requests) * 100, 2)
            
            # Active users count
            active_user_count = len(self.active_users)
            
            # Document upload stats
            recent_uploads = [
                upload for upload in self.metrics.get('document_uploads', [])
                if datetime.fromisoformat(upload['timestamp']) > cutoff_time
            ]
            
            upload_stats = {}
            if recent_uploads:
                total_size = sum(upload['file_size'] for upload in recent_uploads)
                avg_processing_time = sum(upload['processing_time'] for upload in recent_uploads) / len(recent_uploads)
                
                upload_stats = {
                    'total_uploads': len(recent_uploads),
                    'total_size_mb': round(total_size / (1024 * 1024), 2),
                    'avg_processing_time_ms': round(avg_processing_time, 2)
                }
            
            # Chat interaction stats
            recent_chats = [
                chat for chat in self.metrics.get('chat_interactions', [])
                if datetime.fromisoformat(chat['timestamp']) > cutoff_time
            ]
            
            chat_stats = {}
            if recent_chats:
                ai_responses = sum(1 for chat in recent_chats if chat['is_ai_response'])
                avg_response_time = sum(chat['response_time'] for chat in recent_chats) / len(recent_chats)
                
                satisfaction_scores = [
                    chat['user_satisfaction'] for chat in recent_chats 
                    if chat['user_satisfaction'] is not None
                ]
                
                chat_stats = {
                    'total_interactions': len(recent_chats),
                    'ai_response_rate': round((ai_responses / len(recent_chats)) * 100, 2),
                    'avg_response_time_ms': round(avg_response_time, 2),
                    'avg_satisfaction': round(sum(satisfaction_scores) / len(satisfaction_scores), 2) if satisfaction_scores else None
                }
            
            return {
                'timestamp': datetime.now().isoformat(),
                'period_hours': hours,
                'active_users': active_user_count,
                'response_times': avg_response_times,
                'error_rates': error_rates,
                'upload_stats': upload_stats,
                'chat_stats': chat_stats,
                'system_counters': dict(self.counters)
            }
    
    def get_alerts(self) -> List[Dict[str, Any]]:
        """Check for alert conditions and return list of alerts"""
        alerts = []
        metrics = self.get_metrics_summary(hours=1)  # Check last hour
        
        # High error rate alert
        for endpoint, error_rate in metrics.get('error_rates', {}).items():
            if error_rate > 5.0:  # More than 5% error rate
                alerts.append({
                    'type': 'high_error_rate',
                    'severity': 'warning' if error_rate < 10 else 'critical',
                    'message': f"High error rate on {endpoint}: {error_rate}%",
                    'endpoint': endpoint,
                    'error_rate': error_rate
                })
        
        # Slow response time alert
        for endpoint, stats in metrics.get('response_times', {}).items():
            if stats['avg_ms'] > 2000:  # Slower than 2 seconds
                alerts.append({
                    'type': 'slow_response',
                    'severity': 'warning' if stats['avg_ms'] < 5000 else 'critical',
                    'message': f"Slow response time on {endpoint}: {stats['avg_ms']}ms",
                    'endpoint': endpoint,
                    'avg_response_time': stats['avg_ms']
                })
        
        return alerts

# Global metrics collector instance
metrics_collector = MetricsCollector()
