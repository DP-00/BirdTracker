// import "@arcgis/charts-components/dist/components/arcgis-charts-config-line-chart";
import Camera from "@arcgis/core/Camera";
import Mesh from "@arcgis/core/geometry/Mesh";
import Point from "@arcgis/core/geometry/Point";
import MeshGeoreferencedVertexSpace from "@arcgis/core/geometry/support/MeshGeoreferencedVertexSpace";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
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
    animationDuration: 500,
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
    animationDuration: 500,
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
    animationDuration: 500,
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

  const { features } = await pointLayer.queryFeatures();
  const last = features.length - 1;
  const updatedFeatures = [];
  features.forEach((graphic, index) => {
    const geometry = graphic.geometry as Point;
    if (index === 0 || index === last) {
      return;
    }

    const a = features[index - 1].geometry as Point;
    const b = features[index + 1].geometry as Point;

    const ga = heading(geometry, a);
    const gb = heading(b, geometry);
    let roll = ga - gb;
    if (roll < -90 || 90 < roll) {
      roll = (roll % 90) * -1;
    }

    if (!isFinite(roll)) {
      roll = 0;
    }

    graphic.attributes["roll"] = Math.floor(roll);

    graphic.attributes["heading"] = Math.floor(heading(b, a));

    updatedFeatures.push(graphic);
  });

  // somehow corrupt displaying cylinders
  // await pointLayer.applyEdits({
  //   updateFeatures: updatedFeatures,
  // });

  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  let feature = await getLatestVisibleFeature(pointLayer, timeSlider);

  let point = new Point({
    latitude: feature.geometry.latitude,
    longitude: feature.geometry.longitude,
    z: feature.geometry.altitude,
  });

  let birdMesh = (
    await Mesh.createFromGLTF(point, "./flying_crow_color.glb", {
      vertexSpace: "local",
    })
  )
    .scale(80)
    .rotate(0, 0, 90);
  await birdMesh.load();
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

  await arcgisScene.view.graphics.add(animationTarget);

  const cameraControl = document.getElementById(
    "camera-control",
  ) as HTMLCalciteSegmentedControlElement;

  const cameraBirdControl = document.getElementById(
    "bird-camera-control",
  ) as HTMLCalciteSegmentedControlElement;

  const cameraPathControl = document.getElementById(
    "camera-zoom",
  ) as HTMLCalciteSegmentedControlElement;

  cameraPathControl.addEventListener("click", async () => {
    arcgisScene.view.goTo(pointLayer.fullExtent);
  });
  gaugeContainer!.style.display = "none";

  cameraControl?.addEventListener("calciteSegmentedControlChange", async () => {
    if (cameraControl.value == "bird") {
      const feature = await getLatestVisibleFeature(pointLayer, timeSlider);

      await arcgisScene.view.goTo(feature);

      timeSlider.addEventListener(
        "arcgisPropertyChange",
        updateSceneFromTimeSlider,
      );
      gaugeContainer!.style.display = "block";
    } else {
      // timeSlider.removeEventListener(
      //   "arcgisPropertyChange",
      //   handleTimeSliderChange,
      // );
      gaugeContainer!.style.display = "none";

      arcgisScene.view.goTo(pointLayer.fullExtent);
    }
  });

  async function updateSceneFromTimeSlider(event: any) {
    const feature = await getLatestVisibleFeature(pointLayer, timeSlider);
    console.log(feature);
    if (!feature) return;

    let isFront = -1;

    if (cameraBirdControl.value === "bird-camera-back") {
      isFront = 1;
    }

    const point = new Point({
      latitude: feature.geometry.latitude,
      longitude: feature.geometry.longitude,
      z: feature.attributes.altitude + 30,
    });

    const mesh = new Mesh({
      spatialReference: birdMesh.spatialReference,
      vertexSpace: birdMesh.vertexSpace,
      vertexAttributes: {
        // position: [0, 0, 500], // top view
        position: [isFront * 300, 0, 50], // back view
      } as any,
    });

    mesh.centerAt(point);
    mesh.rotate(0, 0, feature.attributes.heading);

    const cameraMesh = await meshUtils.convertVertexSpace(
      mesh,
      new MeshGeoreferencedVertexSpace(),
    );

    if (cameraControl.value == "bird") {
      arcgisScene.view.camera = new Camera({
        position: new Point({
          spatialReference: cameraMesh.spatialReference,
          x: cameraMesh.vertexAttributes.position[0],
          y: cameraMesh.vertexAttributes.position[1],
          z: cameraMesh.vertexAttributes.position[2],
        }),
        tilt: -1 * isFront * 80,
        // heading: feature.attributes.heading,
        heading: -feature.attributes.heading + 90,
      });
      // arcgisScene.view.camera = new Camera({
      //   position: point,
      //   tilt: 75,
      //   heading: feature.attributes.heading,
      // });

      // arcgisScene.view.goTo(
      //   {
      //     center: point,
      //     heading: feature.attributes.heading,
      //     tilt: 75,
      //     scale: 500,
      //   },
      //   {
      //     speedFactor: 10,
      //     easing: "linear",
      //   },
      // );

      speedGauge.value = feature.attributes.speed;
      headingGauge.value = feature.attributes.heading;
      altitudeGauge.value = feature.attributes.altitude;

      let now = new Date(feature.attributes.timestamp);
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
      document.getElementById("time-dashboard")!.innerText =
        `${now.getDate()} ${monthNames[now.getMonth()]}   ${hours}:${minutes}`;
    }

    birdMesh.centerAt(point);
    birdMesh.transform = initialTransform?.clone();
    // birdMesh.rotate(-feature.attributes.roll, 0, feature.attributes.heading);
    birdMesh.rotate(0, 0, feature.attributes.heading);

    console.log(arcgisScene.view.camera.heading);
    console.log(feature.attributes.heading + 270);
  }
}

function heading(a: Point, b: Point) {
  const atan2 = Math.atan2(b.y - a.y, b.x - a.x);
  return 180 - (atan2 * 180) / Math.PI;
}

async function getLatestVisibleFeature(pointLayer, timeSlider) {
  const timeExtent = timeSlider.timeExtent;
  const query = pointLayer.createQuery();
  query.where = "1=1";
  query.timeExtent = timeExtent;
  query.outFields = ["*"];
  query.orderByFields = ["timestamp DESC"];
  query.returnGeometry = true;
  query.num = 1; // Get only the latest one

  try {
    const result = await pointLayer.queryFeatures(query);
    if (result.features.length > 0) {
      return result.features[0];
    } else {
      console.log("No feature found in time range");
      return null;
    }
  } catch (err) {
    console.error("Query failed: ", err);
    return null;
  }
}
