#!/usr/bin/env python3
"""
Test script to verify backend functionality and create test users
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"Health check: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on port 8000")
        return False

def create_test_users():
    """Create test users for each role"""
    users = [
        {
            "email": "citizen@test.com",
            "password": "password123",
            "full_name": "John Citizen",
            "ic_number": "123456789012",
            "phone_number": "+60123456789",
            "address": "123 Test Street, Kuala Lumpur",
            "user_type": "citizen"
        },
        {
            "email": "officer@pdrm.gov.my",
            "password": "password123",
            "full_name": "Officer Ahmad",
            "ic_number": "987654321098",
            "phone_number": "+60198765432",
            "address": "PDRM Headquarters, Kuala Lumpur",
            "user_type": "pdrm"
        },
        {
            "email": "agent@insurance.com",
            "password": "password123",
            "full_name": "Sarah Insurance",
            "ic_number": "456789123456",
            "phone_number": "+60145678901",
            "address": "Insurance Building, Kuala Lumpur",
            "user_type": "insurance"
        }
    ]
    
    print("\n📝 Creating test users...")
    for user in users:
        try:
            response = requests.post(f"{BASE_URL}/auth/register", json=user)
            if response.status_code == 200:
                print(f"✅ Created {user['user_type']} user: {user['email']}")
            elif response.status_code == 400 and "already registered" in response.text:
                print(f"ℹ️  {user['user_type']} user already exists: {user['email']}")
            else:
                print(f"❌ Failed to create {user['user_type']} user: {response.status_code}")
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"❌ Error creating {user['user_type']} user: {e}")

def test_login(email, password, user_type):
    """Test login for a user"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✅ {user_type} login successful")
            
            # Test protected endpoint
            headers = {"Authorization": f"Bearer {token}"}
            me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            if me_response.status_code == 200:
                user_info = me_response.json()
                print(f"   User info: {user_info['full_name']} ({user_info['user_type']})")
                return token
            else:
                print(f"❌ Failed to get user info: {me_response.status_code}")
        else:
            print(f"❌ {user_type} login failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error testing {user_type} login: {e}")
    
    return None

def test_endpoints():
    """Test key endpoints"""
    print("\n🔐 Testing authentication...")
    
    # Test citizen login
    citizen_token = test_login("citizen@test.com", "password123", "Citizen")
    
    # Test PDRM login
    pdrm_token = test_login("officer@pdrm.gov.my", "password123", "PDRM Officer")
    
    # Test insurance login
    insurance_token = test_login("agent@insurance.com", "password123", "Insurance Agent")
    
    print("\n📊 Testing endpoints...")
    
    # Test PDRM reports endpoint
    if pdrm_token:
        try:
            headers = {"Authorization": f"Bearer {pdrm_token}"}
            response = requests.get(f"{BASE_URL}/pdrm/reports", headers=headers)
            if response.status_code == 200:
                reports = response.json()
                print(f"✅ PDRM reports endpoint working ({len(reports)} reports)")
            else:
                print(f"❌ PDRM reports endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing PDRM endpoint: {e}")
    
    # Test insurance reports endpoint
    if insurance_token:
        try:
            headers = {"Authorization": f"Bearer {insurance_token}"}
            response = requests.get(f"{BASE_URL}/insurance/reports", headers=headers)
            if response.status_code == 200:
                reports = response.json()
                print(f"✅ Insurance reports endpoint working ({len(reports)} reports)")
            else:
                print(f"❌ Insurance reports endpoint failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing insurance endpoint: {e}")

def main():
    print("🧪 PDRM Backend Test Script")
    print("=" * 40)
    
    if not test_health():
        print("\n💡 To start the backend, run:")
        print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    create_test_users()
    test_endpoints()
    
    print("\n📋 Test User Credentials:")
    print("=" * 40)
    print("Citizen:    citizen@test.com / password123")
    print("PDRM:       officer@pdrm.gov.my / password123") 
    print("Insurance:  agent@insurance.com / password123")
    print("\n💡 Use these credentials to login to the frontend")

if __name__ == "__main__":
    main()