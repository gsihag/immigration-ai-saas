
"""
Health check endpoints and monitoring utilities for Immigration AI SaaS
"""
import time
import psutil
import logging
from datetime import datetime
from typing import Dict, Any, List
import asyncio
import aiohttp
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class HealthChecker:
    """Comprehensive health checking for all system components"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.start_time = datetime.now()
    
    async def check_database_health(self) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        try:
            start_time = time.time()
            
            # Test basic connectivity
            result = self.supabase.table('users').select('count').execute()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'timestamp': datetime.now().isoformat(),
                'details': 'Database connection successful'
            }
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def check_storage_health(self) -> Dict[str, Any]:
        """Check file storage system health"""
        try:
            start_time = time.time()
            
            # Test storage bucket access
            buckets = self.supabase.storage.list_buckets()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status': 'healthy',
                'response_time_ms': round(response_time, 2),
                'buckets_available': len(buckets),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Storage health check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'status': 'healthy',
                'cpu_usage_percent': cpu_percent,
                'memory_usage_percent': memory.percent,
                'memory_available_gb': round(memory.available / (1024**3), 2),
                'disk_usage_percent': disk.percent,
                'disk_free_gb': round(disk.free / (1024**3), 2),
                'uptime_seconds': (datetime.now() - self.start_time).total_seconds(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"System resource check failed: {str(e)}")
            return {
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def comprehensive_health_check(self) -> Dict[str, Any]:
        """Run all health checks and return comprehensive status"""
        try:
            # Run all checks concurrently
            db_health, storage_health = await asyncio.gather(
                self.check_database_health(),
                self.check_storage_health()
            )
            
            system_health = self.check_system_resources()
            
            # Determine overall health
            all_checks = [db_health, storage_health, system_health]
            overall_status = 'healthy' if all(
                check['status'] == 'healthy' for check in all_checks
            ) else 'degraded'
            
            return {
                'overall_status': overall_status,
                'timestamp': datetime.now().isoformat(),
                'checks': {
                    'database': db_health,
                    'storage': storage_health,
                    'system': system_health
                }
            }
        except Exception as e:
            logger.error(f"Comprehensive health check failed: {str(e)}")
            return {
                'overall_status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

async def get_health_status() -> Dict[str, Any]:
    """Main health check endpoint function"""
    checker = HealthChecker(
        supabase_url="https://kwubrzqtcahbwnztjtcr.supabase.co",
        supabase_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dWJyenF0Y2FoYnduenRqdGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzg2MjksImV4cCI6MjA2NjYxNDYyOX0.Bf169PM5SqZaoqcSrAyS5MpiESR-7rqeJoNp-kPx5gg"
    )
    return await checker.comprehensive_health_check()
