
"""
Alert system for monitoring and notifications
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import json
import aiohttp

from .metrics import metrics_collector
from .health_checks import get_health_status

logger = logging.getLogger(__name__)

class AlertManager:
    """Manage alerts and notifications for system monitoring"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.alert_history = []
        self.suppressed_alerts = set()
        
    async def check_alerts(self) -> List[Dict[str, Any]]:
        """Check all alert conditions and return active alerts"""
        alerts = []
        
        # Get metrics-based alerts
        metrics_alerts = metrics_collector.get_alerts()
        alerts.extend(metrics_alerts)
        
        # Get health-based alerts
        health_status = await get_health_status()
        if health_status['overall_status'] != 'healthy':
            alerts.append({
                'type': 'system_health',
                'severity': 'critical' if health_status['overall_status'] == 'unhealthy' else 'warning',
                'message': f"System health is {health_status['overall_status']}",
                'details': health_status
            })
        
        # Check for database issues
        if 'checks' in health_status:
            db_health = health_status['checks'].get('database', {})
            if db_health.get('status') != 'healthy':
                alerts.append({
                    'type': 'database_issue',
                    'severity': 'critical',
                    'message': 'Database health check failed',
                    'details': db_health
                })
            
            # Check database response time
            if db_health.get('response_time_ms', 0) > 1000:
                alerts.append({
                    'type': 'slow_database',
                    'severity': 'warning',
                    'message': f"Database response time is slow: {db_health.get('response_time_ms')}ms",
                    'response_time': db_health.get('response_time_ms')
                })
        
        # Filter out suppressed alerts
        active_alerts = [
            alert for alert in alerts 
            if self._should_send_alert(alert)
        ]
        
        return active_alerts
    
    def _should_send_alert(self, alert: Dict[str, Any]) -> bool:
        """Determine if an alert should be sent (not suppressed)"""
        alert_key = f"{alert['type']}:{alert.get('endpoint', 'system')}"
        
        # Check if alert is suppressed
        if alert_key in self.suppressed_alerts:
            return False
        
        # Check if we've recently sent this alert (prevent spam)
        cutoff_time = datetime.now() - timedelta(minutes=30)
        recent_alerts = [
            a for a in self.alert_history 
            if a['timestamp'] > cutoff_time and a['type'] == alert['type']
        ]
        
        if len(recent_alerts) >= 3:  # Don't send more than 3 of same type per 30 min
            return False
        
        return True
    
    async def send_alert(self, alert: Dict[str, Any]):
        """Send alert notification via configured channels"""
        alert['timestamp'] = datetime.now()
        self.alert_history.append(alert)
        
        # Send email notification if configured
        if self.config.get('email_alerts_enabled'):
            await self._send_email_alert(alert)
        
        # Send Slack notification if configured
        if self.config.get('slack_webhook_url'):
            await self._send_slack_alert(alert)
        
        # Log alert
        logger.warning(f"ALERT: {alert['type']} - {alert['message']}")
    
    async def _send_email_alert(self, alert: Dict[str, Any]):
        """Send email alert notification"""
        try:
            smtp_config = self.config.get('smtp', {})
            if not smtp_config:
                return
            
            msg = MimeMultipart()
            msg['From'] = smtp_config['from_email']
            msg['To'] = ', '.join(smtp_config['to_emails'])
            msg['Subject'] = f"Immigration AI Alert: {alert['type']}"
            
            body = f"""
            Alert Type: {alert['type']}
            Severity: {alert['severity']}
            Message: {alert['message']}
            Timestamp: {alert['timestamp']}
            
            Details: {json.dumps(alert.get('details', {}), indent=2)}
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            server = smtplib.SMTP(smtp_config['server'], smtp_config['port'])
            if smtp_config.get('use_tls'):
                server.starttls()
            if smtp_config.get('username'):
                server.login(smtp_config['username'], smtp_config['password'])
            
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {str(e)}")
    
    async def _send_slack_alert(self, alert: Dict[str, Any]):
        """Send Slack alert notification"""
        try:
            webhook_url = self.config.get('slack_webhook_url')
            if not webhook_url:
                return
            
            color = '#ff0000' if alert['severity'] == 'critical' else '#ffaa00'
            
            payload = {
                'attachments': [{
                    'color': color,
                    'title': f"Immigration AI Alert: {alert['type']}",
                    'text': alert['message'],
                    'fields': [
                        {'title': 'Severity', 'value': alert['severity'], 'short': True},
                        {'title': 'Timestamp', 'value': str(alert['timestamp']), 'short': True}
                    ]
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(webhook_url, json=payload) as response:
                    if response.status != 200:
                        logger.error(f"Failed to send Slack alert: {response.status}")
                        
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {str(e)}")
    
    def suppress_alert(self, alert_type: str, endpoint: str = 'system', duration_minutes: int = 60):
        """Suppress alerts for a specific type and duration"""
        alert_key = f"{alert_type}:{endpoint}"
        self.suppressed_alerts.add(alert_key)
        
        # Schedule removal of suppression
        async def remove_suppression():
            await asyncio.sleep(duration_minutes * 60)
            self.suppressed_alerts.discard(alert_key)
        
        asyncio.create_task(remove_suppression())

async def monitor_system():
    """Main monitoring loop"""
    config = {
        'email_alerts_enabled': True,
        'slack_webhook_url': None,  # Configure via environment variable
        'smtp': {
            'server': 'smtp.gmail.com',
            'port': 587,
            'use_tls': True,
            'from_email': 'alerts@immigrationai.com',
            'to_emails': ['admin@immigrationai.com'],
            'username': None,  # Configure via environment variable
            'password': None   # Configure via environment variable
        }
    }
    
    alert_manager = AlertManager(config)
    
    while True:
        try:
            alerts = await alert_manager.check_alerts()
            
            for alert in alerts:
                await alert_manager.send_alert(alert)
            
            # Wait 5 minutes before next check
            await asyncio.sleep(300)
            
        except Exception as e:
            logger.error(f"Error in monitoring loop: {str(e)}")
            await asyncio.sleep(60)  # Wait 1 minute on error
