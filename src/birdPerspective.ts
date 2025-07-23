// import "@arcgis/charts-components/dist/components/arcgis-charts-config-line-chart";
import Camera from "@arcgis/core/Camera";
import Mesh from "@arcgis/core/geometry/Mesh";
import Point from "@arcgis/core/geometry/Point";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";

declare global {
  interface Window {
    RadialGauge: any;
    LinearGauge: any;
  }

  const RadialGauge: any;
  const LinearGauge: any;
}

export {};

// import { PieChartModel } from "https://js.arcgis.com/charts-model/4.32/index.js";
export async function setBirdPerspective(arcgisScene, pointLayer) {
  // const chartElement = document.getElementById("plot");
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

  const gaugeContainer = document.getElementById("gauges-container");
  gaugeContainer!.style.display = "none";
  const cameraControl = document.getElementById(
    "camera-control",
  ) as HTMLCalciteSegmentedControlElement;

  const cameraPathControl = document.getElementById(
    "camera-zoom",
  ) as HTMLCalciteSegmentedControlElement;
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  let animationSwitch = document.getElementById("play-animation")!;
  let animationPlayRate = document.getElementById("animation-playrate");
  let timeInfo = document.getElementById("time-info");
  let cameraSide = document.getElementById("camera-side");
  const timeStep = 40;
  let isPlaying = false;
  const query = pointLayer.createQuery();
  query.returnGeometry = true;
  query.returnZ = true;
  query.outFields = ["*"];
  query.orderByFields = ["timestamp"];
  const { features } = await pointLayer.queryFeatures(query);
  const timeDates = [];
  features.forEach((feature) => {
    timeDates.push(new Date(feature.attributes.timestamp));
  });

  // SET MODEL
  // const modelUrl = "./flying_crow_color.glb";
  const modelUrl =
    "https://raw.githubusercontent.com/RalucaNicola/bird-migration/refs/heads/main/public/assets/flying_crow_color.glb";
  // const modelUrl =
  // "https://raw.githubusercontent.com/DP-00/BirdTracker/refs/heads/main/public/flying_crow_color.glb";

  let birdMesh = (
    await Mesh.createFromGLTF(features[0].geometry, modelUrl, {
      vertexSpace: "local",
    })
  ).scale(30);
  // .offset(0, 0, 100);
  const initialTransform = birdMesh.transform?.clone();
  const animationTarget = new Graphic({
    geometry: birdMesh,
    symbol: new MeshSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: {
            color: [255, 255, 255],
          },
        }),
      ],
    }),
  });
  view.graphics.add(animationTarget);

  cameraPathControl.addEventListener("click", async () => {
    arcgisScene.view.goTo(pointLayer.fullExtent);
  });

  cameraControl?.addEventListener("calciteSegmentedControlChange", async () => {
    if (cameraControl.value == "bird") {
      await arcgisScene.view.goTo(animationTarget);
      gaugeContainer!.style.display = "block";
      // timeSlider.mode = "cumulative-from-start";
    } else {
      isPlaying = false;
      gaugeContainer!.style.display = "none";
      arcgisScene.view.goTo(pointLayer.fullExtent);
      // timeSlider.mode = "time-window";
    }
  });

  animationSwitch.addEventListener("click", () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      animationSwitch.icon = "pause-f";
      updateVisualization(timeSlider.timeExtent.end);
    } else {
      animationSwitch.icon = "play-f";
    }
  });
  const updateVisualization = (time) => {
    if (isPlaying) {
      requestAnimationFrame(() => {
        const playRate = animationPlayRate.value;
        let currentTime =
          timeSlider.timeExtent.end.getTime() + timeStep * playRate;
        if (currentTime >= timeSlider.fullTimeExtent.end) {
          currentTime = timeSlider.fullTimeExtent.start;
        }
        timeSlider.timeExtent.end = currentTime;
        let now = new Date(currentTime);
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const monthNames = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];
        // document.getElementById("time-dashboard")!.innerText =
        //   `${now.getDate()} ${monthNames[now.getMonth()]}   ${hours}:${minutes}`;
        updateBirdAndCameraPosition(currentTime, timeDates, arcgisScene);
        updateVisualization(currentTime);
      });
    }
  };
  async function updateBirdAndCameraPosition(time, timeDates, arcgisScene) {
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
    while (i <= timeDates.length - 1 && time > timeDates[i + 1]) {
      i++;
    }
    const t = (time - timeDates[i]) / (timeDates[i + 1] - timeDates[i]);
    const p1 = features[i].geometry;
    const p2 = features[i + 1].geometry;
    const point = interpolate(p1, p2, t);
    let heading = getHeading(p1, point);
    let altitude = Math.floor(lerp(p1.z, p2.z, t));
    let speed = Math.floor(
      lerp(features[i].attributes.speed, features[i + 1].attributes.speed, t),
    );

    // const mesh = new Mesh({
    //   spatialReference: birdMesh.spatialReference,
    //   vertexSpace: birdMesh.vertexSpace,
    //   vertexAttributes: {
    //     position: [0, isFront * (-120 - cameraSideOffset), 60],
    //   },
    // });

    birdMesh.centerAt(point);
    birdMesh.transform = initialTransform?.clone();
    birdMesh.offset(0, 0, 10);
    birdMesh.rotate(0, 0, -heading);

    const birdOrigin = webMercatorUtils.geographicToWebMercator(
      birdMesh.origin,
    ) as Point;
    console.log("bOrg", birdOrigin);
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

    // if (!geodeticDistanceOperator.isLoaded()) {
    //   await geodeticDistanceOperator.load();
    // }

    // let distanceToLine = geodeticDistanceOperator.execute(
    //   birdMesh.origin,
    //   point,
    // );
    // console.log(distanceToLine);
    // mesh.centerAt(point);
    // mesh.rotate(0, 0, heading + cameraSideOffset);
    // const cameraMesh = await meshUtils.convertVertexSpace(
    //   mesh,
    //   new MeshGeoreferencedVertexSpace(),
    // );
    // if (!isFollowing) {
    //   arcgisScene.view.camera = new Camera({
    //     position: new Point({
    //       spatialReference: cameraMesh.spatialReference,
    //       x: cameraMesh.vertexAttributes.position[0],
    //       y: cameraMesh.vertexAttributes.position[1],
    //       z: cameraMesh.vertexAttributes.position[2],
    //     }),
    //     heading: -heading - cameraSideOffset,
    //     tilt: isFront * 90,
    //     fov: 105,
    //   });
    // }

    speedGauge.value = speed;
    headingGauge.value = heading;
    altitudeGauge.value = altitude;
  }
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

function getHeading(a, b) {
  const atan2 = Math.PI / 2 - Math.atan2(b.y - a.y, b.x - a.x);
  return (atan2 * 180) / Math.PI;
}
// ALL ARG NUMBERS
const lerp = (a, b, t, modulo) => {
  let d = b - a;
  if (modulo) {
    if (d > modulo / 2) {
      d = -d + modulo;
    } else if (d < -modulo / 2) {
      d = d + modulo;
    }
  }
  return a + d * t;
};
// A, B - GRAPHIC geometry, T - NUMBER
const interpolate = (a, b, t) => {
  const origin = new Point({
    spatialReference: a.spatialReference,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  });
  return origin;
};
