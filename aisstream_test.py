"""
AISstream vessel count test script.
Run this after you have your AISSTREAM_API_KEY.

Usage:
  set AISSTREAM_API_KEY=your_key_here
  python aisstream_test.py

Reports vessel counts in all three corridors over a 60-second window.
"""
import asyncio
import json
import os
from collections import defaultdict
import websockets

BOUNDING_BOXES = {
    "Hormuz": [[25.3, 56.2], [27.5, 59.5]],    # Strait of Hormuz
    "Red_Sea": [[12.5, 32.5], [30.0, 43.5]],    # Red Sea / Bab-el-Mandeb
    "Cape": [[-35.5, 15.0], [-33.0, 22.0]],     # Cape of Good Hope approach
}

API_KEY = os.environ.get("AISSTREAM_API_KEY", "")

async def test_vessel_count(duration_seconds=60):
    if not API_KEY:
        print("ERROR: Set AISSTREAM_API_KEY environment variable first.")
        print("  set AISSTREAM_API_KEY=your_key_here")
        return

    vessel_counts = defaultdict(set)  # corridor -> set of MMSIs
    message_count = 0

    url = "wss://stream.aisstream.io/v0/stream"
    print(f"Connecting to {url} ...")
    print(f"Subscribing to {len(BOUNDING_BOXES)} corridors for {duration_seconds}s ...\n")

    try:
        async with websockets.connect(url, open_timeout=15) as ws:
            print("WebSocket CONNECTED\n")

            # Subscribe to all three boxes at once
            payload = {
                "APIKey": API_KEY,
                "BoundingBoxes": list(BOUNDING_BOXES.values()),
                "FilterMessageTypes": ["PositionReport"]
            }
            await ws.send(json.dumps(payload))

            async def read_messages():
                nonlocal message_count
                async for raw in ws:
                    msg = json.loads(raw)
                    if msg.get("MessageType") == "PositionReport":
                        mmsi = msg["MetaData"]["MMSI"]
                        lat = msg["MetaData"]["latitude"]
                        lon = msg["MetaData"]["longitude"]

                        # Classify by bounding box
                        for name, (sw, ne) in BOUNDING_BOXES.items():
                            if sw[0] <= lat <= ne[0] and sw[1] <= lon <= ne[1]:
                                vessel_counts[name].add(mmsi)

                        message_count += 1
                        if message_count % 20 == 0:
                            print(f"  {message_count} msgs received | " +
                                  " | ".join(f"{k}: {len(v)} vessels" for k, v in vessel_counts.items()))

            await asyncio.wait_for(read_messages(), timeout=duration_seconds)

    except asyncio.TimeoutError:
        pass  # Expected — timeout after duration_seconds
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")

    print(f"\n=== RESULTS after {duration_seconds}s ===")
    print(f"Total messages: {message_count}")
    for corridor, mmsis in vessel_counts.items():
        print(f"  {corridor}: {len(mmsis)} unique vessels")
    if not vessel_counts:
        print("  No vessels seen — check API key and coverage")


if __name__ == "__main__":
    asyncio.run(test_vessel_count(duration_seconds=60))
