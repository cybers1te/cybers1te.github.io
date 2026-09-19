import json
import urllib.request

for endpoint in ("/api/stats", "/api/recent-sessions", "/api/top-attackers"):
    with urllib.request.urlopen("http://127.0.0.1:5000" + endpoint, timeout=5) as response:
        payload = json.loads(response.read())
        print(endpoint, response.status, type(payload).__name__)
