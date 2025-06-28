
#!/usr/bin/env python3
"""
Deployment script for Immigration AI SaaS platform
This script handles deployment to various environments
"""

import os
import sys
import subprocess
import json
import time
import argparse
import logging
from pathlib import Path
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImmigrationAIDeployment:
    def __init__(self, environment='production'):
        self.environment = environment
        self.project_root = Path(__file__).parent.parent
        self.build_dir = self.project_root / 'dist'
        self.env_file = self.project_root / f'.env.{environment}'
        
        # Environment-specific configurations
        self.config = {
            'development': {
                'build_command': 'npm run dev',
                'port': 5173,
                'health_check_url': 'http://localhost:5173'
            },
            'staging': {
                'build_command': 'npm run build',
                'port': 3001,
                'health_check_url': 'https://staging.immigrationai.com'
            },
            'production': {
                'build_command': 'npm run build',
                'port': 3000,
                'health_check_url': 'https://immigrationai.com'
            }
        }
    
    def validate_environment(self):
        """Validate deployment environment and prerequisites"""
        logger.info(f"Validating {self.environment} environment...")
        
        # Check if environment file exists
        if not self.env_file.exists() and self.environment != 'development':
            logger.error(f"Environment file not found: {self.env_file}")
            return False
        
        # Check Node.js and npm
        try:
            subprocess.run(['node', '--version'], capture_output=True, check=True)
            subprocess.run(['npm', '--version'], capture_output=True, check=True)
        except subprocess.CalledProcessError:
            logger.error("Node.js or npm not found")
            return False
        
        # Check if all dependencies are installed
        node_modules = self.project_root / 'node_modules'
        if not node_modules.exists():
            logger.info("Installing dependencies...")
            try:
                subprocess.run(['npm', 'ci'], cwd=self.project_root, check=True)
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install dependencies: {e}")
                return False
        
        logger.info("✓ Environment validation passed")
        return True
    
    def run_tests(self):
        """Run test suite before deployment"""
        logger.info("Running test suite...")
        
        try:
            # Run unit tests
            subprocess.run(['npm', 'run', 'test'], cwd=self.project_root, check=True)
            logger.info("✓ Unit tests passed")
            
            # Run build test
            subprocess.run(['npm', 'run', 'build'], cwd=self.project_root, check=True)
            logger.info("✓ Build test passed")
            
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Tests failed: {e}")
            return False
    
    def build_application(self):
        """Build the application for deployment"""
        logger.info(f"Building application for {self.environment}...")
        
        # Set environment variables
        env = os.environ.copy()
        if self.env_file.exists():
            with open(self.env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        env[key] = value
        
        try:
            build_command = self.config[self.environment]['build_command']
            subprocess.run(build_command.split(), cwd=self.project_root, env=env, check=True)
            logger.info("✓ Application built successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Build failed: {e}")
            return False
    
    def deploy_to_server(self, server_config):
        """Deploy to a remote server using SSH"""
        logger.info(f"Deploying to {server_config['host']}...")
        
        # Create deployment archive
        archive_name = f"immigration-ai-{self.environment}-{int(time.time())}.tar.gz"
        archive_path = self.project_root / archive_name
        
        try:
            # Create archive
            subprocess.run([
                'tar', '-czf', str(archive_path),
                '-C', str(self.project_root),
                'dist', 'package.json', 'package-lock.json'
            ], check=True)
            
            # Upload to server
            scp_command = [
                'scp', str(archive_path),
                f"{server_config['user']}@{server_config['host']}:{server_config['deploy_path']}"
            ]
            subprocess.run(scp_command, check=True)
            
            # Extract and restart on server
            ssh_commands = [
                f"cd {server_config['deploy_path']}",
                f"tar -xzf {archive_name}",
                "npm install --production",
                "pm2 reload immigration-ai || pm2 start ecosystem.config.js --env production",
                f"rm {archive_name}"
            ]
            
            ssh_command = [
                'ssh', f"{server_config['user']}@{server_config['host']}",
                ' && '.join(ssh_commands)
            ]
            subprocess.run(ssh_command, check=True)
            
            # Cleanup local archive
            archive_path.unlink()
            
            logger.info("✓ Deployment to server completed")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Server deployment failed: {e}")
            if archive_path.exists():
                archive_path.unlink()
            return False
    
    def deploy_docker(self):
        """Deploy using Docker"""
        logger.info("Deploying with Docker...")
        
        try:
            # Build Docker image
            docker_build_command = [
                'docker', 'build',
                '-t', f'immigration-ai:{self.environment}',
                '--build-arg', f'NODE_ENV={self.environment}',
                '.'
            ]
            subprocess.run(docker_build_command, cwd=self.project_root, check=True)
            
            # Stop existing container if running
            try:
                subprocess.run(['docker', 'stop', f'immigration-ai-{self.environment}'], 
                             capture_output=True, check=False)
                subprocess.run(['docker', 'rm', f'immigration-ai-{self.environment}'], 
                             capture_output=True, check=False)
            except:
                pass
            
            # Start new container
            port = self.config[self.environment]['port']
            docker_run_command = [
                'docker', 'run', '-d',
                '--name', f'immigration-ai-{self.environment}',
                '-p', f'{port}:3000',
                '--env-file', str(self.env_file) if self.env_file.exists() else '.env.example',
                f'immigration-ai:{self.environment}'
            ]
            subprocess.run(docker_run_command, cwd=self.project_root, check=True)
            
            logger.info("✓ Docker deployment completed")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Docker deployment failed: {e}")
            return False
    
    def health_check(self, max_retries=30, delay=10):
        """Perform health check on deployed application"""
        logger.info("Performing health check...")
        
        health_url = self.config[self.environment]['health_check_url']
        
        for attempt in range(max_retries):
            try:
                response = requests.get(health_url, timeout=10)
                if response.status_code == 200:
                    logger.info("✓ Health check passed")
                    return True
            except requests.RequestException:
                pass
            
            if attempt < max_retries - 1:
                logger.info(f"Health check attempt {attempt + 1}/{max_retries} failed, retrying in {delay}s...")
                time.sleep(delay)
        
        logger.error("Health check failed - application may not be responding correctly")
        return False
    
    def rollback(self, backup_path=None):
        """Rollback to previous deployment"""
        logger.info("Rolling back deployment...")
        
        try:
            if backup_path:
                # Restore from specific backup
                subprocess.run(['cp', '-r', backup_path, str(self.build_dir)], check=True)
            else:
                # Use git to rollback to previous commit
                subprocess.run(['git', 'checkout', 'HEAD~1'], cwd=self.project_root, check=True)
                self.build_application()
            
            # Restart application
            if self.environment == 'production':
                subprocess.run(['pm2', 'reload', 'immigration-ai'], check=True)
            
            logger.info("✓ Rollback completed")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    def create_backup(self):
        """Create backup of current deployment"""
        logger.info("Creating deployment backup...")
        
        backup_dir = self.project_root / 'backups'
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = int(time.time())
        backup_name = f"backup-{self.environment}-{timestamp}"
        backup_path = backup_dir / backup_name
        
        try:
            if self.build_dir.exists():
                subprocess.run(['cp', '-r', str(self.build_dir), str(backup_path)], check=True)
                logger.info(f"✓ Backup created: {backup_path}")
                return str(backup_path)
            else:
                logger.warning("No existing build to backup")
                return None
        except subprocess.CalledProcessError as e:
            logger.error(f"Backup failed: {e}")
            return None
    
    def deploy(self, deployment_type='build', server_config=None, skip_tests=False):
        """Main deployment workflow"""
        logger.info(f"Starting deployment to {self.environment} environment...")
        
        # Create backup
        backup_path = self.create_backup()
        
        try:
            # Validation
            if not self.validate_environment():
                return False
            
            # Testing
            if not skip_tests and not self.run_tests():
                return False
            
            # Build
            if not self.build_application():
                return False
            
            # Deploy based on type
            if deployment_type == 'docker':
                if not self.deploy_docker():
                    return False
            elif deployment_type == 'server' and server_config:
                if not self.deploy_to_server(server_config):
                    return False
            elif deployment_type == 'build':
                logger.info("Build completed - files ready for manual deployment")
            
            # Health check
            if deployment_type in ['docker', 'server']:
                if not self.health_check():
                    logger.warning("Health check failed - consider rolling back")
                    return False
            
            logger.info(f"✓ Deployment to {self.environment} completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            if backup_path:
                logger.info("Attempting rollback...")
                self.rollback(backup_path)
            return False

def main():
    parser = argparse.ArgumentParser(description='Deploy Immigration AI SaaS platform')
    parser.add_argument('environment', choices=['development', 'staging', 'production'],
                       help='Deployment environment')
    parser.add_argument('--type', choices=['build', 'docker', 'server'], default='build',
                       help='Deployment type')
    parser.add_argument('--skip-tests', action='store_true',
                       help='Skip running tests before deployment')
    parser.add_argument('--server-host', help='Server hostname for server deployment')
    parser.add_argument('--server-user', help='Server username for server deployment')
    parser.add_argument('--server-path', help='Server deployment path')
    parser.add_argument('--rollback', help='Rollback to specific backup path')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    deployment = ImmigrationAIDeployment(args.environment)
    
    # Handle rollback
    if args.rollback:
        success = deployment.rollback(args.rollback)
        sys.exit(0 if success else 1)
    
    # Configure server deployment
    server_config = None
    if args.type == 'server':
        if not all([args.server_host, args.server_user, args.server_path]):
            logger.error("Server deployment requires --server-host, --server-user, and --server-path")
            sys.exit(1)
        
        server_config = {
            'host': args.server_host,
            'user': args.server_user,
            'deploy_path': args.server_path
        }
    
    # Run deployment
    success = deployment.deploy(
        deployment_type=args.type,
        server_config=server_config,
        skip_tests=args.skip_tests
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
