import requests
import os
from pathlib import Path

def test_prediction():
    # API endpoint
    url = "http://localhost:8000/predict"
    
    # Path to test image (updated to new prototype dataset)
    image_path = Path("app/datasets/data/wbssData_prototype/train/1. Eczema 1677/v-neurotic-excoriations-44.jpg")
    
    if not image_path.exists():
        print(f"Error: Test image not found at {image_path}")
        return
    
    # Prepare the file for upload
    files = {
        'file': ('test_image.jpg', open(image_path, 'rb'), 'image/jpeg')
    }
    
    try:
        # Make the request
        response = requests.post(url, files=files)
        
        # Check if request was successful
        if response.status_code == 200:
            result = response.json()
            print("\nPrediction Results:")
            print(f"Top Prediction: {result['top_prediction']}")
            print(f"Confidence: {result['confidence']:.2%}")
            print("\nAll Predictions:")
            for condition, prob in result['predictions'].items():
                print(f"{condition}: {prob:.2%}")
        else:
            print(f"Error: API request failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")
    
    finally:
        # Close the file
        files['file'][1].close()

if __name__ == "__main__":
    test_prediction() 