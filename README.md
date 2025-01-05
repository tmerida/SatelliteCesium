# SatelliteCesium

This project consists of showing the orbits of the last 8 hours since the last [CelesTrak](https://celestrak.org/) update of the currently **active satellites**. It will show the earth provided by the [CesiumJS](https://cesium.com/platform/cesiumjs/) library, which is also used to draw the orbits of the selected satellite.
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
   xcopy /e /i node_modules\cesium\Build public\cesium #Windows
   cp -r node_modules/cesium/Build public/cesium #Linux

4. **Launch the project**  
   ```bash
   npm run dev

   

   
