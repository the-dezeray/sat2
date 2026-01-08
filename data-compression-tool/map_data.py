import json
from datetime import datetime
import os

def map_extreme_min(input_file, output_file):
    """
    Extremely minifies satellite data for high-performance Vite applications.
    - Uses arrays instead of objects (saves key repetition)
    - Truncates precision to 6 decimal places
    - Converts Epoch to Unix Timestamps
    - Removes all whitespace
    """
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    with open(input_file, 'r') as f:
        data = json.load(f)

    minified = []
    for s in data:
        try:
            # Convert ISO Epoch to Unix Timestamp
            epoch_str = s.get("EPOCH", "")
            # Handle potential trailing Z or microseconds
            epoch_dt = datetime.fromisoformat(epoch_str.replace('Z', '+00:00'))
            timestamp = int(epoch_dt.timestamp())

            # Format: [id, name, timestamp, inclination, raan, eccentricity, arg_perigee, mean_anomaly, mean_motion, bstar]
            # Precision is balanced for visualization vs accuracy
            entry = [
                s.get("NORAD_CAT_ID"),
                s.get("OBJECT_NAME", "").strip(),
                timestamp,
                round(float(s.get("INCLINATION", 0)), 6),
                round(float(s.get("RA_OF_ASC_NODE", 0)), 6),
                round(float(s.get("ECCENTRICITY", 0)), 7),
                round(float(s.get("ARG_OF_PERICENTER", 0)), 6),
                round(float(s.get("MEAN_ANOMALY", 0)), 6),
                round(float(s.get("MEAN_MOTION", 0)), 8),
                round(float(s.get("BSTAR", 0)), 10)
            ]
            minified.append(entry)
        except Exception as e:
            continue

    # Write in compact mode (no spaces, no indentation)
    with open(output_file, 'w') as f:
        json.dump(minified, f, separators=(',', ':'))

    original_size = os.path.getsize(input_file) / 1024
    new_size = os.path.getsize(output_file) / 1024
    print(f"Success!")
    print(f"Original: {original_size:.2f} KB")
    print(f"Minified: {new_size:.2f} KB")
    print(f"Reduction: {100 - (new_size/original_size*100):.1f}%")

if __name__ == "__main__":
    base_dir = r"c:\Users\gasen\Downloads\dev\python\s"
    input_path = os.path.join(base_dir, "active.json")
    output_path = os.path.join(base_dir, "minified.json")
    map_extreme_min(input_path, output_path)
