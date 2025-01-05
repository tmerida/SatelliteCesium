# SatelliteCesium

This project consists of showing the orbits of the last 8 hours since the last [CelesTrak](https://celestrak.org/) update of the currently **active satellites**. It will show the earth provided by the [CesiumJS](https://cesium.com/platform/cesiumjs/) library, which is also used to draw the orbits of the selected satellite, also using Satellite.js for the calculations.
Follow these steps to install and test the project:

1. **Navigate to Your Project Directory**  
   Open a terminal and change to the directory containing this Git repository:
   ```bash
   cd /path/to/this/project

2. **Install all dependencies**  
   Use npm to install all the necessary dependencies:
   ```bash
   npm i
   
3. **Create a public folder and copy**  
   CesiumJS requires a few static files to be hosted on your server, like web workers and SVG icons. We need to copy **node_modules/cesium/Build/Cesium** directories and serve them as static files, in the public folder:
   ```bash
   mkdir public
   xcopy /e /i node_modules\cesium\Build\Cesium\ public\cesium #Windows
   cp -r node_modules/cesium/Build/Cesium/ public/cesium #Linux

4. **Launch the project**  
   ```bash
   npm run dev

   
Once the project has been deployed locally you can select any satellite you want from the the dropdown on the top left of the page, this has all the active satellites
I have implemented a system to store the data in the localstorage, because CelesTrak updates the data every 2 hours, and if you make many requests during those 2 hours where the data has not changed they can block your ip and return a 403 error. So to avoid this problem, I save the date of the first time the request is made and I save both the time and the response of the request in the localstorage, and every time the page is refreshed or the **onMounted()** function is called it will load the cached data from the localstorage. And in case two hours have already passed, the request will be called again to update the data again and also the date.

Las funciones que realizan esto son:
```javascript
  loadCesium();
  loadCachedData();
