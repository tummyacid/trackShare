import gpsd
import requests

def get_newToken():
    url = "https://watertower.tummyacid.net/api/login"
    userData = {
    "email": "test3",
    "moniker": "test3",
    "password": "test2"
    }

    x = requests.post(url, json=userData)
    print(x)


def send_location(token):
    gpsd.connect()
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
    print(x)

send_location("")
