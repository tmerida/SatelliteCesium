<template>
      <div id="dropdown-container" style="width: 50%; margin: 8px; z-index: 10; color: white;">
      <v-select
        v-model="selectedOption"
        :options="satelliteNames"
        placeholder="Select a satillete"
        style="background-color: #303336; color: white;"
        class="custom-select"
        variant="outlined"
      />
      <p style="margin: 8px; z-index: 10; color: white; font-size: 14px; position: absolute; top: 75%;"> <strong>Date last update:</strong> {{ dateFormatted }} <br> <strong>Lattitude:</strong>  {{ latitude_exact }} <br> 
        <strong>Longitude:</strong> {{ longitude_exact }} <br> <strong>Distance above the earth surface:</strong> {{ Math.round(altitude_exact / 1000) }} km <br>
        <strong>Orbital Velocity (seconds): </strong> {{ velocityPerSec }} km/s <br> <strong>Orbital Velocity (hours): </strong>{{ velocityPerHour }} km/h
        </p>
    </div>
  <div id="cesiumContainer" style="width: 100%; height: 100vh;"></div>
</template>

<script setup>

import { onMounted, ref, watch } from 'vue';
import {
  Cartesian3,
  createOsmBuildingsAsync,
  Ion,
  Math as CesiumMath,
  Terrain,
  Viewer,
  Color,
} from 'cesium';

import "cesium/Build/Cesium/Widgets/widgets.css";
import axios from 'axios';
import * as satellite from 'satellite.js';
import vSelect from "vue-select";

//Token Cesium Ion
//Ion.defaultAccessToken = 'your-token';

//DECLARE VARIABLES
const cacheData = ref(null);
const lastFetchTime = ref(null);
const CACHE_DURATION = 2 * 60 * 60 * 1000;
const satelliteNames = ref([]);
const selectedOption = ref("");
const satelliteMap = new Map();
const viewer = ref(null);
const longitude_exact = ref(null);
const latitude_exact = ref(null);
const altitude_exact = ref(null);
const dateFormatted = ref(null);
const velocityPerSec = ref(0);
const velocityPerHour = ref(0);

onMounted(() => {
  loadCesium()
  loadCachedData();
  fetchCelesTrakData();
  fillData();
});

async function loadCesium(){
  viewer.value = new Viewer('cesiumContainer', {
    terrain: Terrain.fromWorldTerrain(),
    animation: false,
    timeline: false
  });
}

function loadCachedData() {
  const cachedTime = localStorage.getItem("lastFetchTime");
  const cachedResponse = localStorage.getItem("cacheData");

  if (cachedTime && cachedResponse) {
    lastFetchTime.value = parseInt(cachedTime, 10); 
    cacheData.value = cachedResponse; 
    console.log("Loaded cached data from localStorage");
  }
}

async function fetchCelesTrakData() {
  const currentTime = Date.now();
  const dateFetched = new Date(lastFetchTime.value);
  dateFormatted.value = dateFetched.toISOString();

  if (lastFetchTime.value !== null && currentTime - lastFetchTime.value < CACHE_DURATION) {
    console.log("Using cached data");
    return;
  }

  try {
    const response = await axios.get(
      "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    );
    cacheData.value = response.data;
    lastFetchTime.value = currentTime;
    const dateFetched = new Date(lastFetchTime.value);
    dateFormatted.value = dateFetched.toISOString();
    
    localStorage.setItem("lastFetchTime", currentTime.toString());
    localStorage.setItem("cacheData", response.data);
    console.log("Data fetched and cache updated");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function fillData(){
  const tleLines = cacheData.value.split("\n").filter(line => line.trim() !== "");
  for (let i = 0; i < tleLines.length; i += 3) {
      const name = tleLines[i].trim();
      const line1 = tleLines[i + 1].trim();
      const line2 = tleLines[i + 2].trim();
      if (!satelliteNames.value.includes(name))
        satelliteNames.value.push(name);
      satelliteMap.set(name, [line1, line2]);
  }
}


watch(selectedOption, (newValue, oldValue) => {
  selectedSatellite(newValue, oldValue);
});

function selectedSatellite(option, oldValue) {
  if(satelliteMap.has(option)){
    var tleLine = satelliteMap.get(option);
    if(oldValue)
      deleteOrbit(oldValue);
    printOrbit(option, tleLine[0], tleLine[1]);
  }
  else{
    deleteOrbit(oldValue);
  }
}

function printOrbit(satelliteName, tleLine1, tleLine2){
  const start = new Date();
  const end = new Date(start.getTime() + 8 * 60 * 60 * 1000); // 8h orbit

  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
  const orbitPositions = [];
  for (let time = start; time <= end; time = new Date(time.getTime() + 10000)) { // 10 secs
    const gmst = satellite.gstime(time);
    const positionAndVelocity = satellite.propagate(satrec, time);
    const positionEci = positionAndVelocity.position;

    if (positionEci) {
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);
      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const altitude = positionGd.height * 1000;
      orbitPositions.push(longitude, latitude, altitude);

      velocityPerSec.value = Math.sqrt((positionAndVelocity.velocity.x **2) + (positionAndVelocity.velocity.y**2) + (positionAndVelocity.velocity.z**2)).toFixed(2);
      velocityPerHour.value = (velocityPerSec.value * 3600).toFixed(2);
    }
  }


  const positions = Cartesian3.fromDegreesArrayHeights(orbitPositions);
  viewer.value.entities.add({
    id: satelliteName,
    name: "8 hour Orbit of " +  satelliteName,
    polyline: {
      positions: positions,
      width: 2,
      material: Color.GOLD,
    }
  })

  const positionAndVelocity = satellite.propagate(satrec, start);
  const positionEci = positionAndVelocity.position;
  if (positionEci) {
    const jdStart = calculateJulianDate(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
      start.getUTCSeconds()
    );
    const gmst = satellite.gstime(jdStart);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    longitude_exact.value = satellite.degreesLong(positionGd.longitude);
    latitude_exact.value = satellite.degreesLat(positionGd.latitude);
    altitude_exact.value = positionGd.height * 1000;
    const position = Cartesian3.fromDegrees(longitude_exact.value, latitude_exact.value, altitude_exact.value);

    viewer.value.entities.add({
      id: satelliteName + "_exact",
      name: "Exact Position of "+ satelliteName,
      position: position,
      point: {
        pixelSize: 20,
        color: Color.RED,
      },
    });
    
  }
}

function deleteOrbit(satelliteName){
  removeEntityById(satelliteName);
  removeEntityById(satelliteName + "_exact");
  longitude_exact.value = null;
  latitude_exact.value = null;
  altitude_exact.value = null;
  velocityPerSec.value = 0;
  velocityPerHour.value = 0;
}

function removeEntityById(entityId) {
  const entity = viewer.value.entities.getById(entityId);
  if (entity) {
    viewer.value.entities.remove(entity);
  } else {
    console.log(`No entity found with ID ${entityId}`);
  }
}

function calculateJulianDate(year, month, day, hour, minute, second) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    const timeFraction = (hour + (minute / 60) + (second / 3600)) / 24;
    return JD + timeFraction;
}
</script>

<style>
@import "vue-select/dist/vue-select.css";

#cesiumContainer{
  position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    margin: 0;
    overflow: hidden;
    padding: 0;
    font-family: sans-serif;
}

  .vs__dropdown-menu{
    background-color: #303336 !important;
    color: white;
    overflow-x: hidden;
  }
  .vs__dropdown-option--highlight{
    background: #9d9d9d !important;
    color: white !important;
  }
  .v-select{
    z-index: 10;
  }
  .cesium-viewer-geocoderContainer{
    display: none;
  }
  .vs__clear{
    opacity: .7;
    fill: white !important;
  }
  .vs__open-indicator{
    fill: white !important;
    opacity: .7;
  }
  .vs__selected{
    color: white !important;
    opacity: 1;
  }

</style>
