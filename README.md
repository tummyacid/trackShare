# trekShare

GIS backend to share and update in real-time

# Api

implemented in nodejs against postgresql persistance. The postgresql instance must have postgis extensions enabled.

two functions currently supported:

## GPX track upload and view

Allows anonymous web browsers to upload and retrieve GPX files. These are stored in postgresql and can be viewed by anyone with the link.

[Demonstration here](https://fall.tummyacid.net/)

## Live asset positioning

Allows internet-connected clients in the field to report geolocation using jwt to identify registered assets.

### curl demonstration

```bash
curl -H "Content-Type: application/json" -d ' {"email": "test3","moniker": "test3","password": "test2"}' https://watertower.tummyacid.net/api/login
curl -H "x-access-token: "seeAbove" -H "Content-Type: application/json" -d ' {"geometry": {"type": "Point","coordinates": [-122.3605918,47.6223488]}}' https://watertower.tummyacid.net/api/gpsPosition 
```

### Client.py

proof-of-concept service routine the uses registered credentials to obtain auth token and update position as supplied by a running gpsd service that must exist on the environment. 

I run this on a raspberry pi zero w with a [GPS patch antenna module](https://www.cdtop-tech.com/products/pa1616s). I backhaul the connection with a hotspot on my cell phone when collecting field data

# Postgresql

The Api requires a postgresql database with postgis extentions enabled. Setup and configuration script are listed in setup.sql.

# TODO

html/javascript clients