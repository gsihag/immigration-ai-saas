
# Production Monitoring Guide
## Immigration AI SaaS Platform

### Overview
This guide provides comprehensive instructions for setting up, configuring, and using the monitoring system for the Immigration AI SaaS platform in production environments.

---

## Architecture Overview

### Monitoring Components
- **Health Checks**: System component availability and performance
- **Metrics Collection**: Application performance and usage statistics
- **Alerting System**: Automated notifications for issues and anomalies
- **Dashboard**: Real-time monitoring interface
- **Log Aggregation**: Centralized logging and analysis

### Data Flow
```
Application → Metrics Collector → Alert Manager → Notifications
     ↓              ↓                    ↓
Health Checks → Dashboard ←→ Log Aggregation
```

---

## Installation and Setup

### Prerequisites
```bash
# Install required Python packages
pip install psutil aiohttp asyncio smtplib logging

# Install monitoring tools
npm install -g pm2
apt-get install -y prometheus grafana loki
```

### Environment Configuration
```bash
# Add to .env or environment variables
MONITORING_ENABLED=true
ALERT_EMAIL=admin@immigrationai.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@immigrationai.com
SMTP_PASSWORD=your-app-password

# Health check endpoints
HEALTH_CHECK_INTERVAL=300  # 5 minutes
METRICS_RETENTION_DAYS=30
ALERT_COOLDOWN_MINUTES=15
```

---

## Health Monitoring

### System Health Checks

#### Database Health
The system continuously monitors database connectivity and performance:

```python
# Example health check results
{
  "status": "healthy",
  "response_time_ms": 45.2,
  "timestamp": "2024-01-15T10:30:00Z",
  "details": "Database connection successful"
}
```

**Monitored Metrics:**
- Connection response time
- Query execution time
- Active connections
- Database locks
- Storage usage

#### Storage Health
File storage system monitoring includes:

```python
# Example storage health results
{
  "status": "healthy", 
  "response_time_ms": 120.5,
  "buckets_available": 3,
  "total_files": 1247,
  "storage_used_gb": 15.7,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### System Resources
Real-time system resource monitoring:

```python
# Example system health results
{
  "status": "healthy",
  "cpu_usage_percent": 23.5,
  "memory_usage_percent": 67.2,
  "memory_available_gb": 2.1,
  "disk_usage_percent": 45.8,
  "disk_free_gb": 12.3,
  "uptime_seconds": 86400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Health Check Endpoints

#### Main Health Check
```bash
# Check overall system health
GET /api/health

# Response
{
  "overall_status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "healthy", ... },
    "storage": { "status": "healthy", ... },
    "system": { "status": "healthy", ... }
  }
}
```

#### Component-Specific Checks
```bash
# Database only
GET /api/health/database

# Storage only  
GET /api/health/storage

# System resources only
GET /api/health/system
```

---

## Performance Metrics

### Application Metrics

#### API Response Times
Track response times for all endpoints:

```python
# Metric example
{
  "endpoint": "POST:/api/documents/upload",
  "avg_response_time_ms": 1250.3,
  "min_response_time_ms": 890.1, 
  "max_response_time_ms": 2100.7,
  "total_requests": 1543,
  "error_count": 12,
  "error_rate_percent": 0.78
}
```

#### User Activity Metrics
Monitor user engagement and system usage:

```python
# Activity metrics
{
  "active_users_24h": 234,
  "new_registrations_24h": 12,
  "documents_uploaded_24h": 89,
  "chat_interactions_24h": 456,
  "avg_session_duration_minutes": 23.5
}
```

#### Document Processing Metrics
Track document upload and processing performance:

```python
# Document metrics
{
  "total_uploads_24h": 89,
  "avg_file_size_mb": 2.3,
  "avg_processing_time_ms": 3400,
  "successful_uploads": 87,
  "failed_uploads": 2,
  "virus_detections": 0
}
```

#### Chat System Metrics
Monitor AI and human chat interactions:

```python
# Chat metrics
{
  "total_conversations_24h": 156,
  "ai_responses_24h": 892,
  "human_responses_24h": 203,
  "avg_ai_response_time_ms": 850,
  "avg_human_response_time_minutes": 12.5,
  "user_satisfaction_avg": 4.2
}
```

### Business Metrics

#### Agency Performance
Track agency-specific metrics:

```python
# Agency metrics
{
  "agency_id": "agency-123",
  "active_clients": 45,
  "pending_document_reviews": 23,
  "completed_cases_this_month": 12,
  "avg_case_completion_days": 45.6,
  "client_satisfaction_score": 4.5
}
```

---

## Alert Configuration

### Alert Types and Thresholds

#### Critical Alerts (Immediate Notification)
- **Database Down**: No database connectivity
- **High Error Rate**: >10% error rate on any endpoint
- **System Resources**: >90% CPU or memory usage
- **Storage Full**: >95% disk usage
- **Security Breach**: Unauthorized access attempts

#### Warning Alerts (15-minute delay)
- **Slow Database**: Response time >1000ms
- **High Error Rate**: >5% error rate on any endpoint
- **System Resources**: >80% CPU or memory usage
- **Slow API**: Average response time >2000ms
- **Failed Backups**: Backup verification failures

### Alert Channels

#### Email Alerts
Configure SMTP settings for email notifications:

```python
# Email configuration
{
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "use_tls": True,
  "from_email": "alerts@immigrationai.com",
  "to_emails": [
    "admin@immigrationai.com",
    "ops-team@immigrationai.com"
  ]
}
```

#### Slack Integration
Set up Slack webhook for team notifications:

```json
{
  "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "channel": "#ops-alerts",
  "username": "Immigration AI Monitor",
  "icon_emoji": ":warning:"
}
```

#### SMS Alerts (Optional)
For critical alerts, configure SMS notifications:

```python
# SMS configuration
{
  "provider": "twilio",
  "account_sid": "your-account-sid",
  "auth_token": "your-auth-token",
  "from_number": "+1234567890",
  "to_numbers": ["+1987654321"]
}
```

### Alert Suppression
Prevent alert spam with intelligent suppression:

```python
# Suppression rules
{
  "same_alert_cooldown_minutes": 15,
  "max_alerts_per_hour": 10,
  "maintenance_mode": False,
  "suppressed_alert_types": []
}
```

---

## Dashboard Setup

### Grafana Dashboard

#### Installation
```bash
# Install Grafana
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

#### Dashboard Configuration
```json
{
  "dashboard": {
    "title": "Immigration AI SaaS Monitoring",
    "panels": [
      {
        "title": "System Health Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "immigration_ai_health_status",
            "legendFormat": "{{component}}"
          }
        ]
      },
      {
        "title": "API Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "immigration_ai_response_time_ms",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "immigration_ai_active_users",
            "legendFormat": "Active Users"
          }
        ]
      },
      {
        "title": "Error Rates",
        "type": "graph",
        "targets": [
          {
            "expr": "immigration_ai_error_rate",
            "legendFormat": "{{endpoint}}"
          }
        ]
      }
    ]
  }
}
```

### Custom Dashboard Panels

#### System Overview Panel
- Overall health status
- Active users count
- System uptime
- Current alerts

#### Performance Panel
- API response times
- Database performance
- Storage usage
- Memory and CPU usage

#### Business Metrics Panel
- Document uploads
- Chat interactions
- Case completions
- User satisfaction

#### Error Tracking Panel
- Error rates by endpoint
- Failed requests
- Exception tracking
- Security incidents

---

## Log Management

### Log Aggregation Setup

#### Centralized Logging with Loki
```yaml
# docker-compose.yml addition
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./logs:/var/log
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

#### Log Configuration
```yaml
# promtail-config.yml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: immigration-ai
    static_configs:
      - targets:
          - localhost
        labels:
          job: immigration-ai
          __path__: /var/log/immigration-ai/*.log
```

### Log Analysis Queries

#### Error Analysis
```logql
# Find errors in last hour
{job="immigration-ai"} |= "ERROR" | json | line_format "{{.timestamp}} {{.level}} {{.message}}"

# Database errors
{job="immigration-ai"} |= "database" |= "error"

# Authentication failures
{job="immigration-ai"} |= "authentication" |= "failed"
```

#### Performance Analysis
```logql
# Slow queries
{job="immigration-ai"} |= "slow query" | json | response_time > 1000

# High memory usage
{job="immigration-ai"} |= "memory" | json | memory_usage > 80
```

---

## Monitoring Scripts

### Automated Monitoring Startup
```bash
#!/bin/bash
# start_monitoring.sh
set -e

echo "Starting Immigration AI monitoring services..."

# Start health check daemon
python3 /opt/immigration-ai/monitoring/health_checks.py &
HEALTH_PID=$!
echo "Health checks started (PID: $HEALTH_PID)"

# Start metrics collector
python3 /opt/immigration-ai/monitoring/metrics.py &
METRICS_PID=$!
echo "Metrics collector started (PID: $METRICS_PID)"

# Start alert manager
python3 /opt/immigration-ai/monitoring/alerts.py &
ALERTS_PID=$!
echo "Alert manager started (PID: $ALERTS_PID)"

# Save PIDs for cleanup
echo "$HEALTH_PID $METRICS_PID $ALERTS_PID" > /var/run/monitoring.pids

echo "All monitoring services started successfully"
```

### Health Check Cron Job
```bash
# Add to crontab: crontab -e
# Check health every 5 minutes
*/5 * * * * /opt/immigration-ai/scripts/health_check.sh

# Generate daily reports
0 6 * * * /opt/immigration-ai/scripts/daily_report.sh

# Weekly monitoring review
0 9 * * 1 /opt/immigration-ai/scripts/weekly_review.sh
```

---

## Performance Optimization

### Monitoring Overhead
Keep monitoring lightweight:

```python
# Efficient metrics collection
class LightweightMetrics:
    def __init__(self):
        self.buffer_size = 1000
        self.flush_interval = 60  # seconds
        self.metrics_buffer = []
    
    def record_metric(self, metric_name, value, tags=None):
        # Buffer metrics to reduce I/O
        self.metrics_buffer.append({
            'name': metric_name,
            'value': value,
            'tags': tags or {},
            'timestamp': time.time()
        })
        
        if len(self.metrics_buffer) >= self.buffer_size:
            self.flush_metrics()
    
    def flush_metrics(self):
        # Batch write to reduce overhead
        # Implementation depends on metrics backend
        pass
```

### Resource Limits
```yaml
# Docker resource limits for monitoring
services:
  monitoring:
    image: immigration-ai-monitoring
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 128M
```

---

## Troubleshooting

### Common Issues

#### High CPU Usage in Monitoring
```bash
# Check monitoring process CPU usage
ps aux | grep -E "(health_check|metrics|alerts)" | sort -k3 -nr

# Reduce monitoring frequency if needed
export HEALTH_CHECK_INTERVAL=600  # 10 minutes instead of 5
```

#### Missing Metrics
```bash
# Check metrics collector status
systemctl status immigration-ai-metrics

# Verify metrics endpoints
curl http://localhost:8080/metrics

# Check log files
tail -f /var/log/immigration-ai/metrics.log
```

#### Alert Spam
```python
# Adjust alert thresholds
alert_config = {
    'error_rate_threshold': 10,  # Increase from 5%
    'response_time_threshold': 3000,  # Increase from 2000ms
    'cooldown_minutes': 30  # Increase from 15 minutes
}
```

### Monitoring the Monitoring
Monitor the monitoring system itself:

```bash
# Health check for monitoring services
#!/bin/bash
# monitor_monitoring.sh

services=("health_checks" "metrics" "alerts")

for service in "${services[@]}"; do
    if ! pgrep -f "$service" > /dev/null; then
        echo "WARNING: $service is not running"
        # Restart service
        systemctl restart "immigration-ai-$service"
    fi
done
```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Review critical alerts
- Check dashboard for anomalies
- Verify backup completion
- Monitor error rates

#### Weekly
- Analyze performance trends
- Review alert thresholds
- Clean up old log files
- Update monitoring configuration

#### Monthly
- Performance optimization review
- Dashboard updates
- Monitoring system updates
- Capacity planning review

### Cleanup Scripts
```bash
#!/bin/bash
# cleanup_monitoring.sh

# Clean old metric files (older than 30 days)
find /var/log/metrics -name "*.log" -mtime +30 -delete

# Rotate large log files
logrotate /etc/logrotate.d/immigration-ai

# Clean temporary monitoring files
rm -f /tmp/health_check_*
rm -f /tmp/metrics_*

echo "Monitoring cleanup completed"
```

---

## Security Considerations

### Monitoring Security
- **Encrypted Communications**: Use TLS for all monitoring traffic
- **Access Control**: Restrict dashboard access to authorized personnel
- **Audit Logging**: Log all access to monitoring systems
- **Data Privacy**: Anonymize sensitive data in metrics

### Monitoring Configuration Security
```yaml
# Secure monitoring configuration
monitoring:
  tls:
    enabled: true
    cert_file: /etc/ssl/certs/monitoring.crt
    key_file: /etc/ssl/private/monitoring.key
  
  authentication:
    enabled: true
    method: ldap
    ldap_server: ldap.company.com
  
  access_control:
    admin_users: ["admin@immigrationai.com"]
    read_only_users: ["ops@immigrationai.com"]
```

---

## Integration with CI/CD

### Deployment Monitoring
```yaml
# .github/workflows/deploy-with-monitoring.yml
- name: Deploy and Verify
  run: |
    # Deploy application
    ./deploy.sh
    
    # Wait for health checks to pass
    timeout 300 bash -c 'until curl -f http://localhost/api/health; do sleep 10; done'
    
    # Verify monitoring is working
    curl -f http://localhost/api/metrics
    
    # Send deployment notification
    curl -X POST $SLACK_WEBHOOK \
      -H 'Content-type: application/json' \
      --data '{"text":"Deployment completed and monitoring verified"}'
```

---

## Documentation Updates

This monitoring documentation should be reviewed and updated:
- **Monthly**: Check for new monitoring requirements
- **Quarterly**: Update dashboard configurations
- **Semi-annually**: Review alert thresholds and procedures
- **Annually**: Complete monitoring system architecture review

---

**Document Version:** 1.0  
**Last Updated:** $(date)  
**Next Review:** $(date -d '+3 months')  
**Owner:** DevOps Team  
**Contact:** devops@immigrationai.com
