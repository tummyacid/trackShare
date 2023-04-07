<script>
	/*
	This is an example of using Svelte features with Leaflet. Original blog post here: https://imfeld.dev/writing/leaflet_with_svelte
	
	The toolbar and the marker popups are both implemented by embedding Svelte components inside Leaflet elements. The marker and lines are toggled by updating the map from reactive statements.
	
	Any questions? Ask me at dimfeld on Twitter!
	
	Thanks to heroicons.dev for all the icons used here.
	*/
	
	import L from 'leaflet';
	import { AntPath, antPath } from 'leaflet-ant-path';
	import MapToolbar from './MapToolbar.svelte';
	import MarkerPopup from './MarkerPopup.svelte';
	import * as markerIcons from './markers.js';
	let map;
    let gpx;
	
	let markerLocations = [];
	
	const initialView = [39.8283, -98.5795];
	function createMap(container) {
	  let m = L.map(container, {preferCanvas: true }).setView(initialView, 5);
    L.tileLayer(
	    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
	    {
	      attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
          &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
	      subdomains: 'abc',
	      maxZoom: 14,
	    }
	  ).addTo(m);

    return m;
  }
	
	let eye = true;
	let lines = true;
	
	let toolbar = L.control({ position: 'topright' });
	let toolbarComponent;
	toolbar.onAdd = (map) => {
		let div = L.DomUtil.create('div');
		toolbarComponent = new MapToolbar({
			target: div,
			props: {}
		});

		
        toolbarComponent.$on('click-route', ({ detail }) => { 
            loadRoute(detail.detail);
         });
		toolbarComponent.$on('click-eye', ({ detail }) => eye = detail);
		toolbarComponent.$on('click-lines', ({ detail }) => lines = detail);
		toolbarComponent.$on('click-reset', () => {
			map.setView(initialView, 4, { animate: true })
		})

		return div;
	}

	toolbar.onRemove = () => {
		if(toolbarComponent) {
			toolbarComponent.$destroy();
			toolbarComponent = null;
		}
	};
	
	// Create a popup with a Svelte component inside it and handle removal when the popup is torn down.
	// `createFn` will be called whenever the popup is being created, and should create and return the component.
	function bindPopup(marker, createFn) {
		let popupComponent;
		marker.bindPopup(() => {
			let container = L.DomUtil.create('div');
			popupComponent = createFn(container);
			return container;
		});

		marker.on('popupclose', () => {
			if(popupComponent) {
				let old = popupComponent;
				popupComponent = null;
				// Wait to destroy until after the fadeout completes.
				setTimeout(() => {
					old.$destroy();
				}, 500);

			}
		});
	}

    
	
	let markers = new Map();
	
	function markerIcon(count) {
		let html = `<div class="map-marker"><div>${markerIcons.library}</div><div class="marker-text">${count}</div></div>`;
		return L.divIcon({
			html,
			className: 'map-marker'
		});
	}
	

	function createMarker(loc) {
		let count = Math.ceil(Math.random() * 25);
		let name = loc.getElementsByTagName('name')[0];
		let marker = L.marker([loc.getAttribute('lat'), loc.getAttribute('lon')], {loc});
		bindPopup(marker, (m) => {
			let c = new MarkerPopup({
				target: m,
				props: {
					name
				}
			});
			
			c.$on('change', ({detail}) => {
				count = detail;
				marker.setIcon(markerIcon(count));
			});
			
			return c;
		});		
		return marker;
	}

    function createTrack(loc) {

		let icon = markerIcon(loc.getElementsByTagName('name')[0].innerHTML);
        let trkpts = loc.getElementsByTagName('trkpt');
        let start = trkpts[i][0];
        let end = trkpts[i][-1];
        let marker = L.marker([start.getAttribute('lat'), start.getAttribute('lon')], {icon});
    
        bindPopup(marker, (m) => {
            let c = new MarkerPopup({
                target: m,
                props: {
                    count
                }
            });
            
            c.$on('change', ({detail}) => {
                count = detail;
                marker.setIcon(markerIcon(count));
            });
            
            return c;
        });	

        let pointList = [];
        for(let i = 0;i<trkpts.count;i++)
        {
	
            pointList.push([trkpts[j].getAttribute('lat'), trkpts[j].getAttribute('lon')]);
        }
        lineLayers = L.polyline(pointList, { color: '#E4E', opacity: 0.5 });

        lineLayers.addTo(map);            
		return marker;
	}
	
	function createLines(coorArray) {

		return L.polyline(coorArray, { color: '#E4E', opacity: 0.5 });
	}




	let markerLayers;
	let lineLayers;

  function mapAction(container) {
    map = createMap(container); 
		toolbar.addTo(map);

		
    return {
       destroy: () => {
				 toolbar.remove();
				 map.remove();
				 map = null;
			 }
    };
	}
	
	// We could do these in the toolbar's click handler but this is an example
	// of modifying the map with reactive syntax.
	$: if(markerLayers && map) {
		if(eye) {
			markerLayers.addTo(map);
		} else {
			markerLayers.remove();
		}
	}
	
	$: if(lineLayers && map) {
		if(lines) {
			lineLayers.addTo(map);
		} else {
			lineLayers.remove();
		}
	}

    $: if(gpx) {
		markerLayers = L.layerGroup()
        let wpts  = gpx.getElementsByTagNameNS('http://www.topografix.com/GPX/1/1','wpt')
        for (let i = 0; i < wpts.length ;i++) { 
             let m = createMarker(wpts[i]);
             markerLayers.addLayer(m);
        }

        let trks  = gpx.getElementsByTagNameNS('http://www.topografix.com/GPX/1/1','trk')
        for (let i = 0; i < trks.length ;i++) 
		{
            let start = trks[i].getElementsByTagNameNS('http://www.topografix.com/GPX/1/1','trkpt')[0]
			map.setView([start.getAttribute('lat'), start.getAttribute('lon')], 7, { animate: true }) 

            let trksegs = trks[i].getElementsByTagNameNS('http://www.topografix.com/GPX/1/1','trkseg')
            for (let j = 0; j < trksegs.length ;j++)
			{
            	let trkpts = trksegs[j].getElementsByTagNameNS('http://www.topografix.com/GPX/1/1','trkpt')
				let pointList = [];
				for (let k = 0; k < trkpts.length ;k++)
				{
					pointList.push([trkpts[k].getAttribute('lat'), trkpts[k].getAttribute('lon')]);
				}
				lineLayers = L.polyline.antPath(pointList, { color: '#E7E7E7', opacity: 0.75 , hardwareAccelerated: false , pulseColor: '#485696', delay: 800 });
				lineLayers.addTo(map);          
			}
        }

		//markerLayers.addTo(map);
    }
    function loadRoute(routeId) {

        fetch("https://watertower.tummyacid.net/api/" + routeId,{
        headers: {
                'Accept': 'application/xml',
                }
            })
        .then(response => {
             response.text().then(text => {                
                let parser = new DOMParser();
                gpx = parser.parseFromString(text,"application/xml");
            })
        })
    }

	function resizeMap() {
	  if(map) { map.invalidateSize(); }
  }

</script>
<svelte:window on:resize={resizeMap} />

<style>
	.map :global(.marker-text) {
		width:100%;
		text-align:center;
		font-weight:600;
		background-color:#444;
		color:#EEE;
		border-radius:0.5rem;
	}
	
	.map :global(.map-marker) {
		width:30px;
		transform:translateX(-50%) translateY(-25%);
	}
</style>

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
   integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
   crossorigin=""/>

<div class="map" style="height:100%;width:100%" use:mapAction />