import requests
import time
import os
import sys

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/login"
SEED_URL = f"{BASE_URL}/api/products/seed"

# Credentials from .env or defaults
EMAIL = "admin@toofly.com"
PASSWORD = "Musa2005" # Updated from previous discovery

def test_like_workflow():
    print("--- Starting Like API Test ---")
    
    # 1. Ensure Backend is running and seeded
    try:
        print("Ensuring products are seeded...")
        requests.post(SEED_URL, timeout=5)
    except Exception as e:
        print(f"Error seeding: {e}")
        return

    # 2. Login to get token
    print(f"Logging in as {EMAIL}...")
    try:
        response = requests.post(LOGIN_URL, data={
            "username": EMAIL,
            "password": PASSWORD
        }, timeout=5)
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
            
        token = response.json()["access_token"]
        print("Login successful.")
    except Exception as e:
        print(f"Login error: {e}")
        return

    # 3. Get first product ID
    try:
        products_res = requests.get(f"{BASE_URL}/api/products", timeout=5)
        products = products_res.json()
        if not products:
            print("No products found to test.")
            return
        
        product_id = products[0]["id"]
        initial_likes = products[0]["likes_count"]
        print(f"Testing Product ID: {product_id} ('{products[0]['name']}')")
        print(f"Initial Likes: {initial_likes}")
    except Exception as e:
        print(f"Error fetching products: {e}")
        return

    # 4. Perform Like
    headers = {"Authorization": f"Bearer {token}"}
    LIKE_URL = f"{BASE_URL}/api/products/{product_id}/like"
    
    print("\n--- Toggling Like ---")
    try:
        like_res = requests.post(LIKE_URL, headers=headers, timeout=5)
        result = like_res.json()
        print(f"Status: {result['status']}")
        print(f"New Count: {result['new_count']}")
        
        # Verify
        verify_res = requests.get(f"{BASE_URL}/api/products", headers=headers, timeout=5)
        verify_data = [p for p in verify_res.json() if p["id"] == product_id][0]
        print(f"Verified is_liked state: {verify_data['is_liked']}")
        
    except Exception as e:
        print(f"Like request failed: {e}")

if __name__ == "__main__":
    test_like_workflow()
