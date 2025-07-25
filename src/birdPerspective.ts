// import "@arcgis/charts-components/dist/components/arcgis-charts-config-line-chart";
import Camera from "@arcgis/core/Camera";
import Point from "@arcgis/core/geometry/Point";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { getHeading, interpolate, lerp } from "./utils";

declare global {
  interface Window {
    RadialGauge: any;
    LinearGauge: any;
  }

  const RadialGauge: any;
  const LinearGauge: any;
}

export async function setBirdPerspective(arcgisScene, pointLayer) {
  const view = arcgisScene.view;
  const speedGauge = new RadialGauge({
    renderTo: "speedGauge",
    width: 270,
    height: 270,
    units: "km/h",
    title: "Speed",
    minValue: 0,
    maxValue: 30,
    majorTicks: ["0", "5", "10", "15", "20", "25", "30"],
    minorTicks: 5,
    valueInt: 1,
    valueDec: 0,
    strokeTicks: true,
    highlights: [],
    borders: false,
    fontTitleSize: 30,
    fontTicksSize: 50,
    fontUnitsSize: 30,
    fontValueSize: 50,
    valueBoxStroke: 0,
    colorValueText: "#aed8cc",
    colorValueBoxBackground: false,
    colorPlate: "#192a276e",
    colorTitle: "#aed8cc",
    colorUnits: "#aed8cc",
    colorNumbers: "#aed8cc",
    colorMajorTicks: "#aed8cc",
    colorMinorTicks: "#aed8cc",
    colorNeedle: "#aed8cc",
    colorNeedleEnd: "#aed8cc",
    colorNeedleCircleOuter: "#aed8cc",
    colorNeedleCircleInner: "#aed8cc",
    // colorNeedleShadowDown: "#aed8cc",
    valueTextShadow: true,
    colorValueTextShadow: "#aed8cc",
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    valueBox: true,
    animationRule: "linear",
    animationDuration: 40,
    value: 0,
  }).draw();

  const headingGauge = new RadialGauge({
    renderTo: "headingGauge",
    width: 230,
    height: 230,
    minValue: 0,
    maxValue: 360,
    majorTicks: ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"],
    minorTicks: 22,
    ticksAngle: 360,
    startAngle: 180,
    valueInt: 1,
    valueDec: 0,
    strokeTicks: false,
    highlights: false,
    colorPlate: "#192a276e",
    colorTitle: "#aed8cc",
    colorMajorTicks: "#aed8cc",
    colorMinorTicks: "#aed8cc",
    colorNumbers: "#aed8cc",
    colorNeedle: "#aed8cc",
    colorNeedleEnd: "#aed8cc",
    valueBox: false,
    valueTextShadow: true,
    colorValueTextShadow: "#aed8cc",
    colorCircleInner: "#aed8cc",
    colorNeedleCircleOuter: "#aed8cc",
    colorNeedleCircleInner: "#aed8cc",
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    animationRule: "linear",
    needleType: "arrow",
    needleStart: 60,
    needleEnd: 80,
    needleWidth: 5,
    borders: false,
    borderInnerWidth: 0,
    borderMiddleWidth: 0,
    borderOuterWidth: 10,
    colorBorderOuter: "#aed8cc",
    colorBorderOuterEnd: "#aed8cc",
    // colorNeedleShadowDown: "#aed8cc",
    borderShadowWidth: 0,
    animationTarget: "plate",
    fontTitleSize: 30,
    fontUnitsSize: 30,
    fontValueSize: 50,
    animationDuration: 40,
    value: 0,
  }).draw();

  const altitudeGauge = new LinearGauge({
    renderTo: "altitudeGauge",
    width: 150,
    height: 450,
    title: "Altitude",
    units: "m.a.s.l.",
    minValue: 0,
    maxValue: 5000,
    majorTicks: [
      "0",
      "500",
      "1500",
      "2000",
      "2500",
      "3000",
      "3500",
      "4000",
      "4500",
      "5000",
    ],
    minorTicks: 5,
    valueInt: 1,
    valueDec: 0,
    strokeTicks: true,
    highlights: [],
    barWidth: 20,
    colorPlate: "#192a276e",
    borderShadowWidth: 0,
    borders: false,
    needleType: "arrow",
    needleWidth: 2,
    animationDuration: 40,
    animationRule: "linear",
    tickSide: "left",
    numberSide: "left",
    needleSide: "left",
    barStrokeWidth: 0,
    barBeginCircle: false,
    valueBoxStroke: 0,
    colorValueBoxBackground: false,
    colorTitle: "#aed8cc",
    colorValueText: "#aed8cc",
    colorUnits: "#aed8cc",
    colorNumbers: "#aed8cc",
    colorMajorTicks: "#aed8cc",
    colorMinorTicks: "#aed8cc",
    colorNeedle: "#aed8cc",
    colorNeedleEnd: "#aed8cc",
    colorBarProgress: "#aed8cc",
    colorBar: "#192a276e",
    value: 0,
    fontTitleSize: 30,
    fontUnitsSize: 30,
    fontValueSize: 50,
    valueTextShadow: true,
    colorValueTextShadow: "#aed8cc",
  }).draw();

  document
    .getElementById("camera-zoom")!
    .addEventListener("click", async () => {
      arcgisScene.view.goTo(pointLayer.fullExtent);
    });
}

export async function updateBirdAndCameraPosition(
  time,
  arcgisScene,
  features,
  birdMesh,
  initialTransform,
) {
  let cameraSide = document.getElementById("camera-side");
  let isFollowing = cameraSide.value === "bird-camera-free" ? true : false;
  let isFront =
    cameraSide.value === "bird-camera-back" ||
    cameraSide.value === "bird-camera-left"
      ? -1
      : 1;
  let cameraSideOffset =
    cameraSide.value === "bird-camera-right" ||
    cameraSide.value === "bird-camera-left"
      ? 120
      : 0;
  let i = 0;
  while (
    i <= features.length - 1 &&
    time > features[i + 1].attributes.timestamp
  ) {
    i++;
  }
  const t =
    (time - features[i].attributes.timestamp) /
    (features[i + 1].attributes.timestamp - features[i].attributes.timestamp);
  const p1 = features[i].geometry;
  const p2 = features[i + 1].geometry;
  const point = interpolate(p1, p2, t);
  let heading = getHeading(p1, point);
  let altitude = Math.floor(lerp(p1.z, p2.z, t));
  let speed = Math.floor(
    lerp(features[i].attributes.speed, features[i + 1].attributes.speed, t),
  );

  birdMesh.centerAt(point);
  birdMesh.transform = initialTransform?.clone();
  birdMesh.offset(0, 0, 10);
  birdMesh.rotate(0, 0, -heading);

  const birdOrigin = webMercatorUtils.geographicToWebMercator(
    birdMesh.origin,
  ) as Point;
  const x =
    birdOrigin.x -
    isFront *
      (40 + cameraSideOffset) *
      Math.sin(((heading - cameraSideOffset) * Math.PI) / 180);
  const y =
    birdOrigin.y -
    isFront *
      (40 + cameraSideOffset) *
      Math.cos(((heading - cameraSideOffset) * Math.PI) / 180);
  const z = birdOrigin.z + 5;
  if (!isFollowing) {
    arcgisScene.view.camera = new Camera({
      position: new Point({
        spatialReference: birdOrigin.spatialReference,
        x,
        y,
        z,
      }),
      heading: heading - cameraSideOffset,
      tilt: isFront * 90,
      fov: 105,
    });
  }

  document.gauges.get("speedGauge").value = speed;
  document.gauges.get("headingGauge").value = heading;
  document.gauges.get("altitudeGauge").value = altitude;
}

// async function updateSceneFromTimeSlider(event: any) {
//   const feature = await getLatestVisibleFeature(pointLayer, timeSlider);
//   const firstFeature = await getFirstVisibleFeature(pointLayer, timeSlider);
//   console.log(feature);
//   if (!feature) return;
//   if (!firstFeature) return;
//   const startTime = new Date(firstFeature.attributes.timestamp).getTime();
//   const endTime = new Date(feature.attributes.timestamp).getTime();
//   console.log("startTime", startTime, endTime);
//   let durationSeconds = (endTime - startTime) / 1000;
//   const daysSelected = Math.floor(durationSeconds / (3600 * 24));
//   durationSeconds -= daysSelected * 3600 * 24;
//   const hoursSelected = Math.floor(durationSeconds / 3600);
//   const sumHoursSelected = daysSelected * 24 + hoursSelected;
//   const verticalDiff = Math.abs(
//     feature.attributes.altitude - firstFeature.attributes.altitude,
//   );
//   if (!geodeticDistanceOperator.isLoaded()) {
//     await geodeticDistanceOperator.load();
//   }

//   let distanceToLine = geodeticDistanceOperator.execute(
//     feature.geometry,
//     firstFeature.geometry,
//   );

//   document.getElementById("dashboard-duration-selected")!.innerHTML =
//     `Selected path: <b style="font-weight:800;">${(distanceToLine / 1000).toFixed(2)} km</b> for <b style="font-weight:800;">${daysSelected} days and ${hoursSelected} hours</b>
//   <br> Horizontal speed: <b style="font-weight:800;">${(distanceToLine / 1000 / sumHoursSelected).toFixed(2)} km/h</b>
//   Vertical speed: <b style="font-weight:800;">${(verticalDiff / 1000 / sumHoursSelected).toFixed(2)} km/h</b>
//   `;

// }
