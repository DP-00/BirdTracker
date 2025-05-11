import * as kernel from "@arcgis/core/kernel";
import "@arcgis/map-components/dist/components/arcgis-scene";
import "@esri/calcite-components/dist/calcite/calcite.css";

import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-action-bar";
import "@esri/calcite-components/dist/components/calcite-action-pad";
import "@esri/calcite-components/dist/components/calcite-block";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-shell";
import "@esri/calcite-components/dist/components/calcite-shell-panel";

import "@arcgis/map-components/dist/components/arcgis-scene";
import App from "./compontents/App";

console.log(`Using ArcGIS Maps SDK for JavaScript v${kernel.fullVersion}`);

// CDN hosted assets
// setAssetPath("https://js.arcgis.com/calcite-components/2.13.2/assets");

const params = new URLSearchParams(document.location.search.slice(1));

const arcgisScene = document.querySelector("arcgis-scene");

const app = new App({
  container: "root",
  // store,
});
