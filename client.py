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
    x = requests.post(url, json=userData)
    return x.text.strip('"')

def send_location(token):
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
    return x.status_code == 200

gpsd.connect()
authToken = ""
while True:
    authToken = get_newToken()
    while (send_location(authToken)):
        time.sleep(10)

