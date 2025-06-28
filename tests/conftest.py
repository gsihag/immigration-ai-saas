
"""
Test configuration and fixtures
"""
import pytest
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    class MockSupabaseClient:
        def __init__(self):
            self.auth = MockAuth()
            self.storage = MockStorage()
        
        def table(self, table_name):
            return MockTable(table_name)
        
        def from_(self, table_name):
            return MockTable(table_name)
    
    class MockAuth:
        def sign_up(self, credentials):
            return {'data': {'user': {'id': 'test-user-123'}}, 'error': None}
        
        def sign_in_with_password(self, credentials):
            return {'data': {'user': {'id': 'test-user-123'}}, 'error': None}
    
    class MockStorage:
        def from_(self, bucket_name):
            return MockBucket(bucket_name)
    
    class MockBucket:
        def __init__(self, name):
            self.name = name
        
        def upload(self, path, file_data):
            return {'data': {'path': path}, 'error': None}
        
        def download(self, path):
            return {'data': b'mock file content', 'error': None}
    
    class MockTable:
        def __init__(self, name):
            self.name = name
            self._data = []
        
        def select(self, columns='*'):
            return self
        
        def insert(self, data):
            return {'data': data, 'error': None}
        
        def update(self, data):
            return {'data': data, 'error': None}
        
        def eq(self, column, value):
            return self
        
        def single(self):
            return {'data': {'id': 'test-123'}, 'error': None}
        
        def execute(self):
            return {'data': [], 'error': None}
    
    return MockSupabaseClient()

@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        'id': 'test-user-123',
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'client',
        'agency_id': 'test-agency-123'
    }

@pytest.fixture
def sample_agency_data():
    """Sample agency data for testing"""
    return {
        'id': 'test-agency-123',
        'name': 'Test Immigration Agency',
        'email': 'admin@testagency.com',
        'phone': '+1-555-0123',
        'website': 'https://testagency.com'
    }

@pytest.fixture
def sample_document_data():
    """Sample document data for testing"""
    return {
        'id': 'test-doc-123',
        'filename': 'test_document.pdf',
        'file_type': 'application/pdf',
        'file_size': 1024000,
        'document_type': 'passport',
        'verification_status': 'pending'
    }
