import requests
import json

url = "http://localhost:8000/api/scorecard"

# The mock transcript with a notoriously bad algorithmic answer
payload = {
    "messages": [
        {"role": "assistant", "content": "How would you find the two numbers in an array that add up to a target sum?"},
        {"role": "user", "content": "I would just use two nested for-loops to check every pair. It works perfectly fine and it's easy to read."}
    ],
    "job_context": "Google SDE L4"
}

print("Sending transcript to the FAANG evaluator...")
try:
    response = requests.post(url, json=payload)
    # Print the beautifully formatted JSON response
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error connecting to server: {e}")
