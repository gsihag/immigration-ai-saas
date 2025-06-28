
#!/usr/bin/env python3
"""
Setup script for Immigration AI SaaS platform
This script handles the initial setup and configuration of the application
"""

import os
import sys
import subprocess
import json
import requests
from pathlib import Path
import argparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImmigrationAISetup:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.env_file = self.project_root / '.env'
        
    def check_prerequisites(self):
        """Check if all prerequisites are installed"""
        logger.info("Checking prerequisites...")
        
        prerequisites = {
            'node': 'node --version',
            'npm': 'npm --version',
            'git': 'git --version'
        }
        
        missing = []
        for name, command in prerequisites.items():
            try:
                subprocess.run(command.split(), capture_output=True, check=True)
                logger.info(f"✓ {name} is installed")
            except (subprocess.CalledProcessError, FileNotFoundError):
                logger.error(f"✗ {name} is not installed or not in PATH")
                missing.append(name)
        
        if missing:
            logger.error(f"Missing prerequisites: {', '.join(missing)}")
            return False
        
        return True
    
    def check_node_version(self):
        """Check if Node.js version meets requirements"""
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            version = result.stdout.strip().lstrip('v')
            major_version = int(version.split('.')[0])
            
            if major_version < 18:
                logger.error(f"Node.js version {version} is not supported. Please install Node.js 18 or higher.")
                return False
            
            logger.info(f"✓ Node.js version {version} is supported")
            return True
        except Exception as e:
            logger.error(f"Failed to check Node.js version: {e}")
            return False
    
    def setup_environment(self):
        """Setup environment variables"""
        logger.info("Setting up environment variables...")
        
        env_example = self.project_root / '.env.example'
        if not env_example.exists():
            logger.error(".env.example file not found")
            return False
        
        # Copy .env.example to .env if .env doesn't exist
        if not self.env_file.exists():
            import shutil
            shutil.copy2(env_example, self.env_file)
            logger.info("Created .env file from .env.example")
        
        # Read current environment variables
        env_vars = {}
        with open(self.env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        
        # Check if Supabase configuration is provided
        required_vars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
        missing_vars = [var for var in required_vars if not env_vars.get(var) or env_vars[var] == 'your-supabase-url']
        
        if missing_vars:
            logger.warning(f"Missing or placeholder values for: {', '.join(missing_vars)}")
            logger.info("Please update your .env file with actual Supabase credentials")
            logger.info("You can get these from your Supabase project dashboard")
            return False
        
        logger.info("✓ Environment variables configured")
        return True
    
    def install_dependencies(self):
        """Install npm dependencies"""
        logger.info("Installing dependencies...")
        
        try:
            subprocess.run(['npm', 'install'], cwd=self.project_root, check=True)
            logger.info("✓ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install dependencies: {e}")
            return False
    
    def setup_database(self):
        """Setup database (Supabase migrations)"""
        logger.info("Setting up database...")
        
        # Check if Supabase CLI is available
        try:
            subprocess.run(['supabase', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("Supabase CLI not found. Please install it to run database migrations.")
            logger.info("Install with: npm install -g supabase")
            return False
        
        # Check if supabase directory exists
        supabase_dir = self.project_root / 'supabase'
        if not supabase_dir.exists():
            logger.warning("Supabase directory not found. Database setup skipped.")
            return False
        
        try:
            # Link to Supabase project
            logger.info("Linking to Supabase project...")
            result = subprocess.run(
                ['supabase', 'status'], 
                cwd=self.project_root, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                logger.info("Please link your Supabase project manually:")
                logger.info("supabase link --project-ref your-project-ref")
                return False
            
            # Run migrations
            logger.info("Running database migrations...")
            subprocess.run(['supabase', 'db', 'push'], cwd=self.project_root, check=True)
            logger.info("✓ Database migrations completed")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Database setup failed: {e}")
            return False
    
    def verify_setup(self):
        """Verify that the setup was successful"""
        logger.info("Verifying setup...")
        
        # Try to build the project
        try:
            subprocess.run(['npm', 'run', 'build'], cwd=self.project_root, check=True, capture_output=True)
            logger.info("✓ Build successful")
        except subprocess.CalledProcessError as e:
            logger.error(f"Build failed: {e}")
            return False
        
        # Check if essential files exist
        essential_files = [
            'src/main.tsx',
            'src/App.tsx',
            'src/components/auth/AuthProvider.tsx',
            'src/integrations/supabase/client.ts'
        ]
        
        for file_path in essential_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                logger.error(f"Essential file missing: {file_path}")
                return False
        
        logger.info("✓ All essential files present")
        return True
    
    def setup_development_environment(self):
        """Setup development environment"""
        logger.info("Setting up development environment...")
        
        # Install development tools
        dev_tools = [
            'husky',
            'lint-staged',
            'prettier'
        ]
        
        for tool in dev_tools:
            try:
                subprocess.run(['npm', 'list', tool], capture_output=True, check=True)
                logger.info(f"✓ {tool} is installed")
            except subprocess.CalledProcessError:
                logger.warning(f"{tool} not found in dependencies")
        
        # Setup git hooks if husky is available
        try:
            subprocess.run(['npx', 'husky', 'install'], cwd=self.project_root, check=True)
            logger.info("✓ Git hooks configured")
        except subprocess.CalledProcessError:
            logger.warning("Failed to setup git hooks")
        
        return True
    
    def print_next_steps(self):
        """Print next steps for the user"""
        logger.info("\n" + "="*50)
        logger.info("SETUP COMPLETE!")
        logger.info("="*50)
        logger.info("\nNext steps:")
        logger.info("1. Update your .env file with actual Supabase credentials")
        logger.info("2. Run 'npm run dev' to start the development server")
        logger.info("3. Visit http://localhost:5173 to view the application")
        logger.info("4. Check docs/user-guides/ for usage instructions")
        logger.info("\nFor production deployment:")
        logger.info("1. Review docs/deployment/deployment-guide.md")
        logger.info("2. Configure your production environment")
        logger.info("3. Run 'npm run build' to create production build")
        logger.info("\nNeed help? Check the documentation or open an issue on GitHub")
    
    def run_setup(self, skip_db=False, dev_only=False):
        """Run the complete setup process"""
        logger.info("Starting Immigration AI SaaS setup...")
        
        steps = [
            ("Checking prerequisites", self.check_prerequisites),
            ("Checking Node.js version", self.check_node_version),
            ("Installing dependencies", self.install_dependencies),
            ("Setting up environment", self.setup_environment),
        ]
        
        if not skip_db:
            steps.append(("Setting up database", self.setup_database))
        
        if dev_only:
            steps.append(("Setting up development environment", self.setup_development_environment))
        
        steps.append(("Verifying setup", self.verify_setup))
        
        for step_name, step_func in steps:
            logger.info(f"\n{step_name}...")
            if not step_func():
                logger.error(f"Setup failed at step: {step_name}")
                return False
        
        self.print_next_steps()
        return True

def main():
    parser = argparse.ArgumentParser(description='Setup Immigration AI SaaS platform')
    parser.add_argument('--skip-db', action='store_true', help='Skip database setup')
    parser.add_argument('--dev-only', action='store_true', help='Setup development environment only')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    setup = ImmigrationAISetup()
    success = setup.run_setup(skip_db=args.skip_db, dev_only=args.dev_only)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
