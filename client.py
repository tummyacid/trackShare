import gpsd
import requests
import time

def get_token():
    url = "https://watertower.tummyacid.net/api/login"
    userData = {
    "email": "test3",
    "password": "test2"
    }
    try:
        r = requests.post(url, json=userData)
        xheader = r.json()
        return xheader["x-access-token"]
    except:
        return "null"

def send_location(token):
    packet = gpsd.get_current()
    while (packet.mode < 2):
        print("aquiring gps fix")
        time.sleep(10)# wait for GPS location lock
        packet = gpsd.get_current()

    position = {
        "geometry":
        {
            "type": "Point",
            "coordinates": [packet.lon, packet.lat]
        },
        "timestamp" : packet.time
    }

    authHeaders = {
        "x-access-token": token
    }

    try:
        x = requests.post('https://watertower.tummyacid.net/api/gpsPosition', json=position, headers=authHeaders)
        return x.status_code
    except:
        return 0

gpsd.connect()
authToken = "null"
while True:
    resp = send_location(authToken)
    if (resp == 200):
        pass
    if (resp == 401):
        authToken = get_token()
        if (authToken != "null"):
            resp = send_location(authToken)
        else:
            resp = 0
    if (resp == 0):
        print("host is down")
    time.sleep(10)

