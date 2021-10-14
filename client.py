import gpsd
import requests
import time

def get_newToken():
    url = "https://watertower.tummyacid.net/api/login"
    userData = {
    "email": "test3",
    "moniker": "test3",
    "password": "test2"
    }
    r = requests.post(url, json=userData)
    xheader = r.json()
    return xheader["x-access-token"]

def send_location(token):
    packet = gpsd.get_current()
    while (packet.mode < 2):
        time.sleep(10)# wait for GPS location lock
        packet = gpsd.get_current()

    url = "https://watertower.tummyacid.net/api/gpsPosition"

    geometry = {
        "geometry":
        {
            "type": "Point",
            "coordinates": [packet.lon, packet.lat]
        }
    }

    myHeaders = {
        "x-access-token": token
    }

    x = requests.post(url, json=geometry, headers=myHeaders)
    return x.status_code

gpsd.connect()
authToken = ""
while True:
    resp = send_location(authToken)
    if (resp == 200):
        pass
    if (resp == 401):
        authToken = get_newToken()
        resp = send_location(authToken)
    if (resp == 403):
        authToken = get_newToken()
        resp = send_location(authToken)
    time.sleep(10)

