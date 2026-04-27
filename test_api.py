import requests
import time

def test():
    print("Sending POST request...", flush=True)
    try:
        r = requests.post('http://localhost:8000/api/analyze', json={'url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'frames': 1, 'threshold': 0.85}, timeout=10)
        r.raise_for_status()
        data = r.json()
        job_id = data['job_id']
        print(f"Job ID: {job_id}", flush=True)
    except Exception as e:
        print(f"Failed to submit: {e}", flush=True)
        return

    prev = None
    for i in range(120):
        try:
            r = requests.get(f'http://localhost:8000/api/analyze/{job_id}', timeout=10)
            status = r.json()
            if status != prev:
                print(status, flush=True)
                prev = status
            if status.get('status') in ('completed', 'failed'):
                break
        except Exception as e:
            print(f"Error checking status: {e}", flush=True)
        time.sleep(2)

if __name__ == "__main__":
    test()
