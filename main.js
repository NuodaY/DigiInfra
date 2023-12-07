import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat, transform} from 'ol/proj';
import Overlay from 'ol/Overlay.js';
import {Stroke, Style, Fill} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import colormap from 'colormap';
import LayerGroup from 'ol/layer/Group.js';
import Draw from 'ol/interaction/Draw.js';
import Select from 'ol/interaction/Select.js'
import { pointerMove } from 'ol/events/condition';
import { getCenter } from 'ol/extent';

const layers = [
  'greater_darwin_access_to_doctors', 
  'greater_darwin_homeless_ratio',
  'greater_darwin_jobs_per_housing_ratio',
  'greater_darwin_teacher_student_ratio'
];
const layerIndicators = [
  'access_to_doctors', 
  'homeless_ratio',
  'jobs_per_housing_ratio',
  'teacher_student_ratio'
]
const geoserver_url = 'https://g10.digitinfra.org/geoserver/G10_ma/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=G10_ma%3A';
let selectedLayerIndex = 0;

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: fromLonLat([131, -12.5]),
    zoom: 9
  })
});

let colors = colormap({
  colormap: 'par',
  nshades: 50,
  format: 'hex',
  alpha: 1
})

const getColor = (feature) => {
  let indicator = feature.get(layerIndicators[selectedLayerIndex]) * 100;
  let index = Math.round(indicator / 3 * 50);
  index = index > 50 ? 50 : index;
  return colors[index];
}

const source0 = new VectorSource({
  url: geoserver_url + layers[0] + '&maxFeatures=50&outputFormat=application%2Fjson',
  maxZoom: 14,
  format: new GeoJSON()
})

const source1 = new VectorSource({
  url: geoserver_url + layers[1] + '&maxFeatures=50&outputFormat=application%2Fjson',
  maxZoom: 14,
  format: new GeoJSON()
})

const source2 = new VectorSource({
  url: geoserver_url + layers[2] + '&maxFeatures=50&outputFormat=application%2Fjson',
  maxZoom: 14,
  format: new GeoJSON()
})

const source3 = new VectorSource({
  url: geoserver_url + layers[3] + '&maxFeatures=50&outputFormat=application%2Fjson',
  maxZoom: 14,
  format: new GeoJSON()
})

const layer0 = new VectorLayer({
  source: source0,
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: getColor(feature),
      }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0.8)',
      }),
    })
  },
  title: layers[0],
  visible: true
});

const layer1 = new VectorLayer({
  source: source1,
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: getColor(feature),
      }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0.8)',
      }),
    })
  },
  title: layers[1],
  visible: false
});

const layer2 = new VectorLayer({
  source: source2,
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: getColor(feature),
      }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0.8)',
      }),
    })
  },
  title: layers[2],
  visible: false
});

const layer3 = new VectorLayer({
  source: source3,
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: getColor(feature),
      }),
      stroke: new Stroke({
        color: 'rgba(255,255,255,0.8)',
      }),
    })
  },
  title: layers[3],
  visible: false
});

let layergroup = new LayerGroup({
  layers: [layer0, layer1, layer2, layer3],
  opacity: 0.6
});
let slider = document.getElementById("myRange");
slider.oninput = function() {
  layergroup.setOpacity(this.value / 10);
}
map.addLayer(layergroup);

const layerSelector = document.getElementById("layers");
layerSelector.addEventListener('change', function(){
  selectedLayerIndex = this.value;
  layergroup.getLayers().forEach((layer)=>{ 
    console.log(layer.get("title"), layers[selectedLayerIndex])
    layer.setVisible(layer.get("title") == layers[selectedLayerIndex])
  })
})

const container = document.getElementById('popup');
const overlay = new Overlay({
  element: container,
});

map.addOverlay(overlay);

map.on("click", function(evt){
  let latLng = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  // 经纬度太长，精确到3位小数
  for (let i in latLng) {
    latLng[i] = latLng[i].toFixed(3)
  }

  container.innerText = `Geographic Coordinates: (${latLng})`;
  overlay.setPosition(evt.coordinate);

  let features = map.forEachFeatureAtPixel(evt.pixel,
    function(feature) {
      return feature;
    }
  );
  console.log(features);
  if (features) {
    let allProperties = features.getProperties();
    let results = {
      SA2: allProperties["sa2_name21"],
      GCC: allProperties["gcc_name21"],
      STE: allProperties["ste_name21"],
      Area: allProperties["areasqkm21"] + " km2"
    }
    let indicator = features.get(layerIndicators[selectedLayerIndex]);
    container.innerText += `\nRegion Information:${JSON.stringify(results, null, 2)}`;
    container.innerText += `\n${layerIndicators[selectedLayerIndex]}: ${(indicator).toFixed(4)}`
  }

})

const selectClick = new Select({
  style: new Style({
    fill: new Fill({
      color: 'yellow',
    }),
    stroke: new Stroke({
      color: 'red',
      width: '3'
    }),
  }),
});

const selectHover = new Select({
  condition: pointerMove,
  style: new Style({
    fill: new Fill({
      color: 'lightgray',
    }),
    stroke: new Stroke({
      color: 'white',
      width: '3'
    }),
  }),
});

map.addInteraction(selectClick);
map.addInteraction(selectHover);

let searchButton = document.querySelector("#search-icon")
searchButton.addEventListener("click", ()=>{
  let input = document.querySelector('.searchbox').value;
  let layers = layergroup.getLayers().getArray();
  let currentLayer = layers[selectedLayerIndex];
  let features = currentLayer.getSource().getFeatures();
  let result_msg = "SA2 Not Found!";
  features.forEach((feature)=>{
    if (feature.get("sa2_name21") == input) {
      let extent = feature.getGeometry().getExtent();
      let centre = getCenter(extent);
      map.setView( new View({
        center: [centre[0] , centre[1]],
        zoom: 12
      }));
      result_msg = "Found";
      return;
    }
  })
  if (result_msg != "Found") {
    alert(result_msg);
  }
})

let infoButton = document.querySelector("#info-icon");
let authorButton = document.querySelector("#github-icon");
let panel = document.querySelector("#info-panel");
infoButton.addEventListener('click', ()=>{
  panel.style.display = "block";
  panel.innerHTML = "<h3>A Digital Infrastructure for Greater Darwin</h3>"
                  + "<p>This digital infrastructure allows users to monitor four city performance indicators in Greater Darwin.</p>"
                  + "<p>They are:</p>"
                  + "<h4>Access To Doctors</h4>"
                  + "<h4>Homeless Ratio</h4>"
                  + "<h4>Jobs per Housing Ratio</h4>"
                  + "<h4>Teacher Student Ratio</h4>"
                  + "<p>Each indicator is shown in a layer. Users can switch the layer through the dropdown list above👆, or change layer opacity through the slider</p>"
                  + "<p>Click on a Statistical Area Lv2 (SA2) region and its information will pop up.</p>"
                  + "<p>Users can also type in a SA2 name to locate to the SA2.</p>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  panel.style.height = "500px";
  document.querySelector("#close-icon").addEventListener('click', ()=>{
    panel.style.display = "none";
  })
})
authorButton.addEventListener('click', ()=>{
  panel.style.display = "block";
  panel.innerHTML = "<h3>The web application is completely developed by Nuoda Yang.</h3>"
                  + "<p>Tools & Tech Stacks: Openlayers + PostGIS + Geoserver + Node.js</p>"
                  + "<p>Coding Languages: HTML + CSS + Javascript</p>"
                  + "<a href=''>Github Repository</a><br>"
                  + "<a href='https://www.linkedin.com/in/nuoda-yang-27883a211/'>Author Linkedin Page</a>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  panel.style.height = "300px";
  document.querySelector("#close-icon").addEventListener('click', ()=>{
    panel.style.display = "none";
  })
})
