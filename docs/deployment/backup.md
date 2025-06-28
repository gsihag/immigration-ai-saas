
# Database Backup Strategy
## Immigration AI SaaS Platform

### Overview
This document outlines the comprehensive backup and disaster recovery strategy for the Immigration AI SaaS platform. The strategy ensures data protection, business continuity, and regulatory compliance.

---

## Backup Strategy Summary

### Backup Types
- **Full Backups**: Complete database backup (daily)
- **Incremental Backups**: Changes since last backup (every 6 hours)
- **Point-in-Time Recovery**: Transaction log backups (every 15 minutes)
- **File Storage Backups**: Document and media files (daily)

### Retention Policy
- **Daily Backups**: Retained for 30 days
- **Weekly Backups**: Retained for 12 weeks
- **Monthly Backups**: Retained for 12 months
- **Yearly Backups**: Retained for 7 years (compliance requirement)

### Recovery Objectives
- **Recovery Time Objective (RTO)**: 4 hours maximum
- **Recovery Point Objective (RPO)**: 15 minutes maximum
- **Data Loss Tolerance**: Zero for critical immigration documents

---

## Supabase Backup Configuration

### Automated Backups
Supabase provides automated daily backups with point-in-time recovery:

```sql
-- Enable point-in-time recovery (if not already enabled)
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'test ! -f /backup/archive/%f && cp %p /backup/archive/%f';
```

### Custom Backup Scripts

#### Daily Full Backup Script
```bash
#!/bin/bash
# daily_backup.sh
set -e

# Configuration
BACKUP_DIR="/backups/daily"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
DB_CONNECTION="postgresql://postgres:password@localhost:5432/postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform database dump
echo "Starting daily backup at $(date)"
pg_dump $DB_CONNECTION \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/immigration_ai_full_$DATE.dump"

# Verify backup
if pg_restore --list "$BACKUP_DIR/immigration_ai_full_$DATE.dump" > /dev/null; then
  echo "Backup verification successful"
else
  echo "Backup verification failed!"
  exit 1
fi

# Cleanup old backups
find $BACKUP_DIR -name "immigration_ai_full_*.dump" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Daily backup completed successfully at $(date)"
echo "Backup file: immigration_ai_full_$DATE.dump"
echo "Backup size: $(du -h $BACKUP_DIR/immigration_ai_full_$DATE.dump | cut -f1)"
```

#### Incremental Backup Script
```bash
#!/bin/bash
# incremental_backup.sh
set -e

# Configuration
BACKUP_DIR="/backups/incremental"
DATE=$(date +%Y%m%d_%H%M%S)
LAST_BACKUP_FILE="/backups/last_backup_timestamp"
DB_CONNECTION="postgresql://postgres:password@localhost:5432/postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Get last backup timestamp
if [ -f "$LAST_BACKUP_FILE" ]; then
  LAST_BACKUP=$(cat $LAST_BACKUP_FILE)
else
  LAST_BACKUP=$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')
fi

# Export incremental changes
echo "Starting incremental backup from $LAST_BACKUP"
psql $DB_CONNECTION << EOF > "$BACKUP_DIR/incremental_$DATE.sql"
-- Backup users modified since last backup
COPY (SELECT * FROM users WHERE updated_at > '$LAST_BACKUP') TO STDOUT WITH CSV HEADER;

-- Backup clients modified since last backup  
COPY (SELECT * FROM clients WHERE updated_at > '$LAST_BACKUP') TO STDOUT WITH CSV HEADER;

-- Backup cases modified since last backup
COPY (SELECT * FROM cases WHERE updated_at > '$LAST_BACKUP') TO STDOUT WITH CSV HEADER;

-- Backup documents modified since last backup
COPY (SELECT * FROM documents WHERE updated_at > '$LAST_BACKUP') TO STDOUT WITH CSV HEADER;

-- Backup chat messages created since last backup
COPY (SELECT * FROM chat_messages WHERE created_at > '$LAST_BACKUP') TO STDOUT WITH CSV HEADER;
EOF

# Update last backup timestamp
date '+%Y-%m-%d %H:%M:%S' > $LAST_BACKUP_FILE

echo "Incremental backup completed at $(date)"
```

### Storage Backup Script
```bash
#!/bin/bash
# storage_backup.sh
set -e

# Configuration
BACKUP_DIR="/backups/storage"
DATE=$(date +%Y%m%d_%H%M%S)
SUPABASE_PROJECT_ID="kwubrzqtcahbwnztjtcr"
SUPABASE_SERVICE_KEY="your-service-key-here"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup document storage using Supabase CLI
echo "Starting storage backup at $(date)"
supabase storage download \
  --project-ref $SUPABASE_PROJECT_ID \
  --recursive \
  --bucket documents \
  --destination "$BACKUP_DIR/documents_$DATE/"

# Create archive
tar -czf "$BACKUP_DIR/documents_backup_$DATE.tar.gz" \
  -C "$BACKUP_DIR" \
  "documents_$DATE"

# Remove temporary directory
rm -rf "$BACKUP_DIR/documents_$DATE"

# Verify archive
if tar -tzf "$BACKUP_DIR/documents_backup_$DATE.tar.gz" > /dev/null; then
  echo "Storage backup verification successful"
else
  echo "Storage backup verification failed!"
  exit 1
fi

echo "Storage backup completed at $(date)"
echo "Archive: documents_backup_$DATE.tar.gz"
echo "Size: $(du -h $BACKUP_DIR/documents_backup_$DATE.tar.gz | cut -f1)"
```

---

## Docker Compose Backup Service

### Backup Service Configuration
```yaml
# Add to docker-compose.yml
services:
  postgres-backup:
    image: postgres:15
    depends_on:
      - postgres
    environment:
      PGPASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./backups:/backups
      - ./scripts/backup:/scripts
    command: |
      sh -c "
        echo '0 2 * * * /scripts/daily_backup.sh' | crontab -
        echo '0 */6 * * * /scripts/incremental_backup.sh' | crontab -
        echo '*/15 * * * * /scripts/wal_backup.sh' | crontab -
        crond -f
      "
    restart: unless-stopped

  storage-backup:
    image: supabase/cli:latest
    environment:
      SUPABASE_ACCESS_TOKEN: ${SUPABASE_ACCESS_TOKEN}
      SUPABASE_PROJECT_ID: ${SUPABASE_PROJECT_ID}
    volumes:
      - ./backups:/backups
      - ./scripts/backup:/scripts
    command: |
      sh -c "
        echo '0 3 * * * /scripts/storage_backup.sh' | crontab -
        crond -f
      "
    restart: unless-stopped
```

---

## Cloud Provider Backup Configuration

### AWS RDS Backup
```bash
# Configure automated backups
aws rds modify-db-instance \
  --db-instance-identifier immigration-ai-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --apply-immediately

# Enable point-in-time recovery
aws rds modify-db-instance \
  --db-instance-identifier immigration-ai-prod \
  --enable-iam-database-authentication \
  --apply-immediately
```

### Google Cloud SQL Backup
```bash
# Configure automated backups
gcloud sql instances patch immigration-ai-prod \
  --backup-start-time=03:00 \
  --backup-location=us-central1 \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7
```

### Azure Database Backup
```bash
# Configure automated backups
az postgres server update \
  --resource-group immigration-ai-rg \
  --name immigration-ai-prod \
  --backup-retention 30 \
  --geo-redundant-backup Enabled
```

---

## Backup Monitoring and Alerting

### Backup Verification Script
```bash
#!/bin/bash
# verify_backups.sh
set -e

BACKUP_DIR="/backups"
ALERT_EMAIL="admin@immigrationai.com"
LOG_FILE="/var/log/backup_verification.log"

echo "$(date): Starting backup verification" >> $LOG_FILE

# Check if daily backup exists and is recent
LATEST_DAILY=$(find $BACKUP_DIR/daily -name "*.dump" -mtime -1 | head -1)
if [ -z "$LATEST_DAILY" ]; then
  echo "ERROR: No recent daily backup found" | tee -a $LOG_FILE
  mail -s "Backup Alert: Daily backup missing" $ALERT_EMAIL < /dev/null
  exit 1
fi

# Verify backup integrity
if ! pg_restore --list "$LATEST_DAILY" > /dev/null 2>&1; then
  echo "ERROR: Daily backup integrity check failed" | tee -a $LOG_FILE
  mail -s "Backup Alert: Backup integrity failure" $ALERT_EMAIL < /dev/null
  exit 1
fi

# Check storage backup
LATEST_STORAGE=$(find $BACKUP_DIR/storage -name "*.tar.gz" -mtime -1 | head -1)
if [ -z "$LATEST_STORAGE" ]; then
  echo "WARNING: No recent storage backup found" | tee -a $LOG_FILE
fi

# Check backup sizes (should be reasonable)
BACKUP_SIZE=$(du -s "$LATEST_DAILY" | cut -f1)
if [ $BACKUP_SIZE -lt 1000 ]; then # Less than 1MB seems too small
  echo "WARNING: Backup size seems unusually small: ${BACKUP_SIZE}KB" | tee -a $LOG_FILE
fi

echo "$(date): Backup verification completed successfully" >> $LOG_FILE
```

### Monitoring Service
```python
#!/usr/bin/env python3
# backup_monitor.py
import os
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MimeText
from pathlib import Path

class BackupMonitor:
    def __init__(self, backup_dir="/backups", alert_email="admin@immigrationai.com"):
        self.backup_dir = Path(backup_dir)
        self.alert_email = alert_email
        self.logger = logging.getLogger(__name__)
    
    def check_daily_backups(self):
        """Check if daily backups are current and valid"""
        daily_dir = self.backup_dir / "daily"
        cutoff_time = datetime.now() - timedelta(hours=25)  # Allow 1 hour grace
        
        recent_backups = [
            f for f in daily_dir.glob("*.dump")
            if datetime.fromtimestamp(f.stat().st_mtime) > cutoff_time
        ]
        
        if not recent_backups:
            self.send_alert("Daily backup missing", "No daily backup found in last 25 hours")
            return False
        
        # Check backup size
        latest_backup = max(recent_backups, key=lambda f: f.stat().st_mtime)
        size_mb = latest_backup.stat().st_size / (1024 * 1024)
        
        if size_mb < 1:  # Less than 1MB
            self.send_alert("Backup size suspicious", f"Latest backup is only {size_mb:.2f}MB")
            return False
        
        return True
    
    def check_storage_backups(self):
        """Check if storage backups are current"""
        storage_dir = self.backup_dir / "storage"
        cutoff_time = datetime.now() - timedelta(hours=25)
        
        recent_backups = [
            f for f in storage_dir.glob("*.tar.gz")
            if datetime.fromtimestamp(f.stat().st_mtime) > cutoff_time
        ]
        
        if not recent_backups:
            self.send_alert("Storage backup missing", "No storage backup found in last 25 hours")
            return False
        
        return True
    
    def send_alert(self, subject, message):
        """Send email alert"""
        try:
            msg = MimeText(f"""
            Backup monitoring alert:
            
            Subject: {subject}
            Message: {message}
            Time: {datetime.now()}
            
            Please investigate immediately.
            """)
            msg['Subject'] = f"Immigration AI Backup Alert: {subject}"
            msg['From'] = "backup-monitor@immigrationai.com"
            msg['To'] = self.alert_email
            
            # Configure SMTP settings based on your email provider
            server = smtplib.SMTP('localhost', 25)
            server.send_message(msg)
            server.quit()
            
        except Exception as e:
            self.logger.error(f"Failed to send alert email: {e}")

if __name__ == "__main__":
    monitor = BackupMonitor()
    monitor.check_daily_backups()
    monitor.check_storage_backups()
```

---

## Disaster Recovery Procedures

### Database Recovery Process

#### Full Database Restore
```bash
#!/bin/bash
# restore_database.sh
set -e

BACKUP_FILE="$1"
TARGET_DB="immigration_ai_restored"
DB_CONNECTION="postgresql://postgres:password@localhost:5432/postgres"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.dump>"
  exit 1
fi

echo "Starting database restore from $BACKUP_FILE"

# Create new database
createdb -h localhost -U postgres $TARGET_DB

# Restore from backup
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=$TARGET_DB \
  --verbose \
  --clean \
  --if-exists \
  "$BACKUP_FILE"

echo "Database restore completed successfully"
echo "Restored database: $TARGET_DB"
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# point_in_time_restore.sh
set -e

TARGET_TIME="$1"  # Format: 2024-01-15 14:30:00
BACKUP_FILE="$2"
WAL_DIR="/backups/wal"

if [ -z "$TARGET_TIME" ] || [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 '<YYYY-MM-DD HH:MM:SS>' <backup_file.dump>"
  exit 1
fi

echo "Performing point-in-time recovery to $TARGET_TIME"

# Stop database
systemctl stop postgresql

# Restore base backup
pg_restore --clean --if-exists --dbname=postgres "$BACKUP_FILE"

# Configure recovery
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp $WAL_DIR/%f %p'
recovery_target_time = '$TARGET_TIME'
recovery_target_timeline = 'latest'
EOF

# Start database in recovery mode
systemctl start postgresql

echo "Point-in-time recovery initiated"
echo "Monitor logs for completion"
```

### Storage Recovery Process
```bash
#!/bin/bash
# restore_storage.sh
set -e

BACKUP_ARCHIVE="$1"
RESTORE_DIR="/var/lib/supabase/storage"

if [ -z "$BACKUP_ARCHIVE" ]; then
  echo "Usage: $0 <storage_backup.tar.gz>"
  exit 1
fi

echo "Starting storage restore from $BACKUP_ARCHIVE"

# Create temporary restore directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract backup
tar -xzf "$BACKUP_ARCHIVE" -C "$TEMP_DIR"

# Restore files to storage directory
rsync -av "$TEMP_DIR/"* "$RESTORE_DIR/"

# Set proper permissions
chown -R supabase:supabase "$RESTORE_DIR"
chmod -R 755 "$RESTORE_DIR"

echo "Storage restore completed successfully"
```

---

## Testing Backup and Recovery

### Monthly Backup Test Script
```bash
#!/bin/bash
# test_backup_restore.sh
set -e

TEST_DIR="/tmp/backup_test_$(date +%Y%m%d)"
LATEST_BACKUP=$(find /backups/daily -name "*.dump" -mtime -1 | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "No recent backup found for testing"
  exit 1
fi

echo "Testing backup restore with $LATEST_BACKUP"

# Create test database
createdb -h localhost -U postgres backup_test_db

# Restore backup to test database
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=backup_test_db \
  --verbose \
  "$LATEST_BACKUP"

# Verify data integrity
psql -h localhost -U postgres -d backup_test_db -c "
  SELECT 
    'users' as table_name, count(*) as record_count 
  FROM users
  UNION ALL
  SELECT 
    'clients' as table_name, count(*) as record_count 
  FROM clients
  UNION ALL
  SELECT 
    'documents' as table_name, count(*) as record_count 
  FROM documents;
"

# Cleanup
dropdb -h localhost -U postgres backup_test_db

echo "Backup test completed successfully"
```

### Recovery Test Checklist
- [ ] **RT-001**: Full database restore test (monthly)
- [ ] **RT-002**: Point-in-time recovery test (quarterly)
- [ ] **RT-003**: Storage backup restore test (monthly)
- [ ] **RT-004**: Cross-region backup restore test (yearly)
- [ ] **RT-005**: Disaster recovery simulation (yearly)

---

## Compliance and Documentation

### Regulatory Requirements
- **GDPR**: Right to be forgotten - backup retention policies
- **SOC 2**: Data protection and recovery procedures
- **Immigration Law**: Long-term document retention (7 years)

### Audit Trail
```sql
-- Create backup audit table
CREATE TABLE backup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(50) NOT NULL,
  backup_path TEXT NOT NULL,
  backup_size BIGINT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log backup operations
CREATE OR REPLACE FUNCTION log_backup_operation(
  p_backup_type VARCHAR(50),
  p_backup_path TEXT,
  p_backup_size BIGINT,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_status VARCHAR(20),
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO backup_audit (
    backup_type, backup_path, backup_size,
    start_time, end_time, status, error_message
  ) VALUES (
    p_backup_type, p_backup_path, p_backup_size,
    p_start_time, p_end_time, p_status, p_error_message
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Maintenance and Updates

### Weekly Maintenance Tasks
```bash
#!/bin/bash
# weekly_maintenance.sh

# Vacuum and analyze database
psql -c "VACUUM ANALYZE;"

# Check backup integrity
./verify_backups.sh

# Update backup statistics
psql -c "
  INSERT INTO backup_stats (week_start, total_backups, total_size)
  SELECT 
    DATE_TRUNC('week', NOW()),
    COUNT(*),
    SUM(backup_size)
  FROM backup_audit
  WHERE created_at >= DATE_TRUNC('week', NOW());
"

# Cleanup old temporary files
find /tmp -name "backup_*" -mtime +7 -delete

echo "Weekly maintenance completed"
```

### Backup Strategy Review Schedule
- **Monthly**: Review backup sizes and performance
- **Quarterly**: Test disaster recovery procedures
- **Semi-annually**: Review retention policies
- **Annually**: Complete disaster recovery simulation

---

## Emergency Contacts

### Escalation Matrix
1. **Database Administrator**: db-admin@immigrationai.com
2. **System Administrator**: sysadmin@immigrationai.com
3. **Development Team Lead**: dev-lead@immigrationai.com
4. **CTO**: cto@immigrationai.com

### Vendor Support
- **Supabase Support**: support@supabase.com
- **Cloud Provider**: [Provider-specific contact]
- **Backup Service**: [Service-specific contact]

---

**Document Version:** 1.0  
**Last Updated:** $(date)  
**Next Review:** $(date -d '+6 months')  
**Owner:** Database Administration Team
