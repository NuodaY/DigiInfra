import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/OSM';
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
import {OverviewMap, defaults as defaultControls} from 'ol/control.js';
import { getArea } from 'ol/sphere.js';
import * as echarts from 'echarts';

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
];
const layerIndicatorsCN = [
  '就医指数', 
  '流浪人口比例',
  '每住户就业比例',
  '教师学生比例'
];
const geoserver_url = 'https://g10.digitinfra.org/geoserver/G10_ma/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=G10_ma%3A';
let selectedLayerIndex = 0;
let isMeasuring = false;
let showGraph = false;
let myChart = echarts.init(document.getElementById('chart'));

const overviewMapControl = new OverviewMap({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  collapsed: false,
});

const map = new Map({
  target: 'map',
  controls: defaultControls().extend([overviewMapControl]),
  layers: [
    new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
      })
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

const styleFunction = function(feature) {
  return new Style({
    fill: new Fill({
      color: getColor(feature),
    }),
    stroke: new Stroke({
      color: 'rgba(255,255,255,0.8)',
    }),
  })
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
  style: styleFunction,
  title: layers[0],
  visible: true
});

const layer1 = new VectorLayer({
  source: source1,
  style: styleFunction,
  title: layers[1],
  visible: false
});

const layer2 = new VectorLayer({
  source: source2,
  style: styleFunction,
  title: layers[2],
  visible: false
});

const layer3 = new VectorLayer({
  source: source3,
  style: styleFunction,
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
  showGraph = false;
  graphButton.style.color = "black";
  graph.style.display = "none";
})

const container = document.getElementById('popup');
const overlay = new Overlay({
  element: container,
});

map.addOverlay(overlay);

map.on("click", function(evt){
  if (isMeasuring) return;
  let latLng = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
  // 经纬度太长，精确到3位小数
  for (let i in latLng) {
    latLng[i] = latLng[i].toFixed(3)
  }
  if (title != "Greater Darwin Digital Infrastructure") {
    container.innerText = `地理坐标: (${latLng})`;
  }
  else {
    container.innerText = `Geographic Coordinates: (${latLng})`;
  }

  overlay.setPosition(evt.coordinate);

  let features = map.forEachFeatureAtPixel(evt.pixel,
    function(feature) {
      return feature;
    }
  );

  if (features) {
    let allProperties = features.getProperties();
    let results = {
      SA2: allProperties["sa2_name21"],
      GCC: allProperties["gcc_name21"],
      STE: allProperties["ste_name21"],
      Area: allProperties["areasqkm21"] + " km²"
    }
    let indicator = features.get(layerIndicators[selectedLayerIndex]);
    if (title != "Greater Darwin Digital Infrastructure") {
      container.innerText += `\n区域信息:${JSON.stringify(results, null, 2)}`;
      container.innerText += `\n${layerIndicatorsCN[selectedLayerIndex]}: ${(indicator).toFixed(4)}`
    }
    else {
      container.innerText += `\nRegion Information:${JSON.stringify(results, null, 2)}`;
      container.innerText += `\n${layerIndicators[selectedLayerIndex]}: ${(indicator).toFixed(4)}`
    }


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
  let result_msg = "SA2 Not Found in Greater Darwin!";
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
let filterButton = document.querySelector("#filter-icon");
let graphButton = document.querySelector("#graph-icon");
let panel = document.querySelector("#info-panel");
let graph = document.querySelector("#chart");
let title = document.querySelector("title").innerText;
infoButton.addEventListener('click', ()=>{
  panel.style.display = "block";
  if (title != "Greater Darwin Digital Infrastructure") {
    panel.innerHTML = "<h3>达尔文市数字基建系统</h3>"
                  + "<p>该系统允许用户监管达尔文市的四个城市表现指标</p>"
                  + "<p>这些指标分别是：</p>"
                  + "<h4>就医指数</h4>"
                  + "<h4>流浪人口比例</h4>"
                  + "<h4>每住户就业比例</h4>"
                  + "<h4>教师学生比例</h4>"
                  + "<p>每一个指标都显示在一个单独的图层中， 用户可以切换正上方的下拉列表来切换图层👆, 也可以用下拉列表下面的滑动栏改变图层透明度</p>"
                  + "<p>选中一个二级统计区域(即SA2)将会跳出区域信息</p>"
                  + "<p>用户也可以输入一个SA2名字来快速定位到改区域</p>"
                  + "<p>左侧的测量工具可以允许用户画一个区域并测量出它的面积 ，点击来启用工具，再次点击来关闭工具</p>"
                  + "<p>点击图表按钮来显示当前图层的图表</p>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }
  else {
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
                  + "<p>The measure button on the left side allows to draw a polygon and measure its area. Click to activate measuring and click again to deactivate.</p>"
                  + "<p>Click the graph button to show grapg for current layer.</p>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }
  
  panel.style.height = "620px";
  document.querySelector("#close-icon").addEventListener('click', ()=>{
    panel.style.display = "none";
  })
})
authorButton.addEventListener('click', ()=>{
  panel.style.display = "block";
  if (title != "Greater Darwin Digital Infrastructure") {
    panel.innerHTML = "<h3>该网页程序的开发完全由杨诺达完成</h3>"
                + "<p>工具和技术栈: Openlayers + PostGIS + Geoserver + Node.js + ECharts</p>"
                + "<p>代码使用语言: HTML + CSS + Javascript</p>"
                + "<p>底图: OpenStreetMap + ArcGIS World Street Map</p>"
                + "<a href='https://github.com/NuodaY/DigiInfra'>Github仓库地址</a><br>"
                + "<a href='https://www.linkedin.com/in/nuoda-yang-27883a211/'>作者领英主页</a>"
                + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }
  else {
    panel.innerHTML = "<h3>The web application is completely developed by Nuoda Yang.</h3>"
                + "<p>Tools & Tech Stacks: Openlayers + PostGIS + Geoserver + Node.js + ECharts</p>"
                + "<p>Coding Languages: HTML + CSS + Javascript</p>"
                + "<p>Basemap: OpenStreetMap + ArcGIS World Street Map</p>"
                + "<a href='https://github.com/NuodaY/DigiInfra'>Github Repository</a><br>"
                + "<a href='https://www.linkedin.com/in/nuoda-yang-27883a211/'>Author Linkedin Page</a>"
                + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }

  panel.style.height = "250px";
  document.querySelector("#close-icon").addEventListener('click', ()=>{
    panel.style.display = "none";
  })
})
filterButton.addEventListener('click', ()=>{
  panel.style.display = "block";
  if (title != "Greater Darwin Digital Infrastructure") {
    panel.innerHTML = "<h3>跟据表达式筛选要素</h3>"
                  + "<input type='text' id='columnName' disabled></input>&nbsp&nbsp"
                  + "<select id='operator'> \
                      <option value='>'>&gt</option> \
                      <option value='='>=</option> \
                      <option value='<'>&lt</option> \
                      </select>&nbsp&nbsp"
                  + "<input type='text' id='number' placeholder='输入数字'></input><br><br>"
                  + "<button id='startFilter'>开始筛选!</button>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }
  else {
    panel.innerHTML = "<h3>Filter the features through expressions.</h3>"
                  + "<input type='text' id='columnName' disabled></input>&nbsp&nbsp"
                  + "<select id='operator'> \
                      <option value='>'>&gt</option> \
                      <option value='='>=</option> \
                      <option value='<'>&lt</option> \
                      </select>&nbsp&nbsp"
                  + "<input type='text' id='number' placeholder='specify a number'></input><br><br>"
                  + "<button id='startFilter'>Start Filter!</button>"
                  + "<i id='close-icon' class='fa-solid fa-xmark fa-xl'></i>"
  }
  
  panel.style.height = "150px";
  document.querySelector("#columnName").value = layerIndicatorsCN[selectedLayerIndex];
  document.querySelector("#close-icon").addEventListener('click', ()=>{
    panel.style.display = "none";
  })
  document.querySelector("#startFilter").addEventListener('click', ()=>{
    let currentLayer = layergroup.getLayers().getArray()[selectedLayerIndex];
    let vectorSource = currentLayer.getSource();
    let url = vectorSource.getUrl();
    let expression = "&CQL_FILTER=" + layerIndicators[selectedLayerIndex] 
                    + document.querySelector("#operator").value
                    + document.querySelector("#number").value;

    fetch(url+expression).then(response=>response.json()).then(data=>{
      const filteredFeatures = new GeoJSON().readFeatures(data, {
        featureProjection: 'EPSG:3857'
      });
      vectorSource.clear();
      vectorSource.addFeatures(filteredFeatures);
    })
    .catch(error => {
      console.error('Error fetching filtered features:', error);
    });
  })
})

let measureButton = document.querySelector("#measure-icon");
let draw, polygonFeature;
draw = new Draw({
  type: "Polygon",
});
draw.addEventListener('drawend', (event)=>{
  polygonFeature = event.feature;
  let area = getArea(polygonFeature.getGeometry()) / 1000000;
  if (title != "Greater Darwin Digital Infrastructure") {
    alert("该区域面积为 " + area + " km²");
  }
  else {
    alert("The area of this polygon is " + area + " km²");
  }

})
measureButton.addEventListener("click", ()=>{
  isMeasuring = !isMeasuring;
  console.log(isMeasuring)
  if (isMeasuring) {
    measureButton.style.color = 'green';
    map.addInteraction(draw);
  }
  else {
    measureButton.style.color = 'black';
    map.removeInteraction(draw);
  }
})

graphButton.addEventListener('click', ()=>{
  showGraph = !showGraph;
  if (showGraph) {
    graphButton.style.color = "green";
    graph.style.display = "block";
    createChart();
  }
  else {
    graphButton.style.color = "black";
    graph.style.display = "none";
  }
})

const createChart = ()=>{
  let xAxis = [];
  let yAxis = [];
  let currentLayer = layergroup.getLayers().getArray()[selectedLayerIndex];
  for (let feature of currentLayer.getSource().getFeatures()) {
    xAxis.push(feature.get("sa2_name21"));
    yAxis.push(feature.get(layerIndicators[selectedLayerIndex]));
  }
  if (title != "Greater Darwin Digital Infrastructure") {
    myChart.setOption({
      title: {
        text: '当前图层图表'
      },
      tooltip: {},
      xAxis: {
        data: xAxis
      },
      yAxis: {},
      series: [
        {
          name: '指标 - ' + layerIndicatorsCN[selectedLayerIndex],
          type: 'bar',
          data: yAxis
        }
      ]
    });
  }
  else {
    myChart.setOption({
      title: {
        text: 'Chart for Current Layer'
      },
      tooltip: {},
      xAxis: {
        data: xAxis
      },
      yAxis: {},
      series: [
        {
          name: 'indicator - ' + layerIndicators[selectedLayerIndex],
          type: 'bar',
          data: yAxis
        }
      ]
    });
  }

}


