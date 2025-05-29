const center_x = 117.3;
const center_y = 172.8;
const scale_x = 0.02072;
const scale_y = 0.0205;

CUSTOM_CRS = L.extend({}, L.CRS.Simple, {
    projection: L.Projection.LonLat,
    scale: function(zoom) {

        return Math.pow(2, zoom);
    },
    zoom: function(sc) {

        return Math.log(sc) / 0.6931471805599453;
    },
	distance: function(pos1, pos2) {
        var x_difference = pos2.lng - pos1.lng;
        var y_difference = pos2.lat - pos1.lat;
        return Math.sqrt(x_difference * x_difference + y_difference * y_difference);
    },
	transformation: new L.Transformation(scale_x, center_x, -scale_y, center_y),
    infinite: true
});

var SateliteStyle = L.tileLayer('mapStyles/styleSatelite/{z}/{x}/{y}.jpg', {minZoom: 0,maxZoom: 8,noWrap: true,continuousWorld: false,attribution: 'Online map GTA V',id: 'SateliteStyle map',}),
	AtlasStyle	= L.tileLayer('mapStyles/styleAtlas/{z}/{x}/{y}.jpg', {minZoom: 0,maxZoom: 5,noWrap: true,continuousWorld: false,attribution: 'Online map GTA V',id: 'styleAtlas map',}),
	GridStyle	= L.tileLayer('mapStyles/styleGrid/{z}/{x}/{y}.png', {minZoom: 0,maxZoom: 5,noWrap: true,continuousWorld: false,attribution: 'Online map GTA V',id: 'styleGrid map',});

var ExampleGroup = L.layerGroup();

var Icons = {
	"Locations" :ExampleGroup,
};

var mymap = L.map('map', {
    crs: CUSTOM_CRS,
    minZoom: 1,
    maxZoom: 5,
    Zoom: 5,
    maxNativeZoom: 5,
    preferCanvas: true,
    layers: [SateliteStyle],
    center: [0, 0],
    zoom: 3,
});

var layersControl = L.control.layers({ "Satelite": SateliteStyle,"Atlas": AtlasStyle,"Grid":GridStyle}, Icons).addTo(mymap);


function customIcon(icon){
	return L.icon({
		iconUrl: `blips/${icon}.png`,
		iconSize:     [20, 20],
		iconAnchor:   [10, 10], 
		popupAnchor:  [0, -5]
	});
}

const coordDisplay = L.DomUtil.create('div', 'mouse-coords');
document.body.appendChild(coordDisplay);

mymap.on('mousemove', function(e) {
  coordDisplay.style.left = (e.originalEvent.pageX + 10) + 'px';
  coordDisplay.style.top = (e.originalEvent.pageY + 10) + 'px';
  coordDisplay.innerHTML = `X: ${e.latlng.lng.toFixed(2)}<br>Y: ${e.latlng.lat.toFixed(2)}`;
});

mymap.on('mouseout', function() {
  coordDisplay.style.display = 'none';
});
mymap.on('mouseover', function() {
  coordDisplay.style.display = 'block';
});

if (typeof pinData !== 'undefined') {
  pinData.forEach(pin => {
    L.marker([pin.y, pin.x], {
      icon: customIcon(pin.icon)
    }).addTo(Icons["Locations"]).bindPopup(pin.label);
  });
}

let currentPins = [];

function loadPins() {
  fetch("https://script.google.com/macros/s/AKfycbw3Pt-f9RCJ1WgPBiktQV1MHUnmbLu8ZdABZAvf7UdkHPaDVYbsETAIlRuyr96FjDIddg/exec") // ← replace with your actual Web App URL
    .then(response => response.text())
    .then(jsCode => {
      const pinData = [];
      eval(jsCode); // populates pinData
      updateMapWithPins(pinData);
    });
}

function updateMapWithPins(newPins) {
  // Compare with current pins to avoid duplicates
  const newJSON = JSON.stringify(newPins);
  const currentJSON = JSON.stringify(currentPins);
  if (newJSON === currentJSON) return; // no changes

  currentPins = newPins;

  // Clear previous pins layer
  Icons["Locations"].clearLayers();

  newPins.forEach(pin => {
    if (Number.isFinite(pin.x) && Number.isFinite(pin.y)) {
      L.marker([pin.y, pin.x], {
        icon: customIcon(pin.icon)
      }).addTo(Icons["Locations"]).bindPopup(pin.label || "Unnamed");
    }
  });
}

// Initial load
loadPins();

// Refresh every 10 seconds
setInterval(loadPins, 10000);
