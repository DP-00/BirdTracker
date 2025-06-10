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
declare var Gauge: any;

const speedOpts = {
  angle: -0.1,
  lineWidth: 0.4,
  radiusScale: 1,
  pointer: {
    length: 0.5,
    strokeWidth: 0.05,
    color: "#aed8cc",
  },
  staticLabels: {
    font: "14px monospace",
    labels: [0, 10, 20, 30, 40, 50],
    color: "#aed8cc",
    fractionDigits: 0,
  },
  renderTicks: {
    divisions: 5,
    divWidth: 2,
    divLength: 0.7,
    divColor: "#aed8cc",
    subDivisions: 5,
    subLength: 0.5,
    subWidth: 1.5,
    subColor: "#aed8cc",
  },
  staticZones: [],
  limitMax: true,
  limitMin: true,
  highDpiSupport: true,
  generateGradient: true,
};

const altitudeOpts = {
  angle: 0.15,
  lineWidth: 0.3,
  radiusScale: 1,
  pointer: {
    length: 0.5,
    strokeWidth: 0.03,
    color: "#aed8cc",
  },
  staticLabels: {
    font: "10px monospace",
    labels: [0, 1000, 2000, 3000],
    color: "#aed8cc",
    fractionDigits: 0,
  },
  renderTicks: {
    divisions: 30,
    divWidth: 0.8,
    divLength: 0.5,
    divColor: "#aed8cc",
    subDivisions: 5,
    subLength: 0.25,
    subWidth: 0.5,
    subColor: "#aed8cc",
  },
  staticZones: [],
  limitMax: true,
  limitMin: true,
  highDpiSupport: true,
  generateGradient: true,
};

const compassOpts = {
  angle: -0.5,
  lineWidth: 0.3,
  radiusScale: 1,
  pointer: {
    length: 0.3,
    strokeWidth: 0.05,
    color: "#aed8cc",
  },
  staticLabels: {
    font: "10px monospace",
    labels: ["W", "S", "N", "E"],
    color: "#aed8cc",
    fractionDigits: 0,
  },
  renderTicks: {
    divisions: 10,
    divWidth: 0.8,
    divLength: 0.5,
    divColor: "#aed8cc",
    subDivisions: 5,
    subLength: 0.25,
    subWidth: 0.5,
    subColor: "#aed8cc",
  },
  staticZones: [],
  limitMax: true,
  limitMin: true,
  highDpiSupport: true,
  generateGradient: true,
};
// import { PieChartModel } from "https://js.arcgis.com/charts-model/4.32/index.js";
export async function setBirdPerspective(arcgisScene, pointLayer) {
  // const chartElement = document.getElementById("plot");
  const gaugeContainer = document.getElementById("gauges-container");

  const gaugeCanvas = document.getElementById("gauge");
  const gauge = new Gauge(gaugeCanvas).setOptions(speedOpts);
  gauge.maxValue = 30;
  gauge.setMinValue(0);
  gauge.set(20);

  const gauge2Canvas = document.getElementById("gauge2");
  const gauge2 = new Gauge(gauge2Canvas).setOptions(altitudeOpts);
  gauge2.maxValue = 3000;
  gauge2.setMinValue(0);
  gauge2.set(1000);

  const gauge3Canvas = document.getElementById("gauge3");
  const gauge3 = new Gauge(gauge3Canvas).setOptions(compassOpts);
  gauge3.maxValue = 359;
  gauge3.setMinValue(0);
  gauge3.set(30);

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
    z: 10000,
    // z: feature.attributes.altitude,
  });

  let paragliderMesh = (
    await Mesh.createFromGLTF(point, "./data/flying_crow_color.glb", {
      vertexSpace: "local",
    })
  )
    .scale(80)
    .rotate(0, 0, 0);
  await paragliderMesh.load();
  const initialTransform = paragliderMesh.transform?.clone();
  const animationTarget = new Graphic({
    geometry: paragliderMesh,
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
  await arcgisScene.view.goTo(point);

  const cameraControl = document.getElementById(
    "camera-control",
  ) as HTMLCalciteSegmentedControlElement;

  gaugeContainer!.style.display = "none";
  cameraControl?.addEventListener("calciteSegmentedControlChange", async () => {
    if (cameraControl.value == "bird") {
      timeSlider.addEventListener(
        "arcgisPropertyChange",
        handleTimeSliderChange,
      );
      gaugeContainer!.style.display = "block";
    } else {
      timeSlider.removeEventListener(
        "arcgisPropertyChange",
        handleTimeSliderChange,
      );
      gaugeContainer!.style.display = "none";

      arcgisScene.view.goTo(pointLayer.fullExtent);
    }
  });

  function handleTimeSliderChange(event) {
    updateSceneFromTimeSlider();
  }

  async function updateSceneFromTimeSlider() {
    const feature = await getLatestVisibleFeature(pointLayer, timeSlider);
    if (!feature) return;

    const point = new Point({
      latitude: feature.geometry.latitude,
      longitude: feature.geometry.longitude,
      z: feature.attributes.altitude + 10,
    });

    const mesh = new Mesh({
      spatialReference: paragliderMesh.spatialReference,
      vertexSpace: paragliderMesh.vertexSpace,
      vertexAttributes: {
        position: [-10, 0, 10],
      } as any,
    });

    mesh.centerAt(point);
    mesh.rotate(-feature.attributes.roll, 0, feature.attributes.heading);

    const cameraMesh = await meshUtils.convertVertexSpace(
      mesh,
      new MeshGeoreferencedVertexSpace(),
    );

    arcgisScene.view.camera = new Camera({
      position: new Point({
        spatialReference: cameraMesh.spatialReference,
        x: cameraMesh.vertexAttributes.position[0],
        y: cameraMesh.vertexAttributes.position[1],
        z: cameraMesh.vertexAttributes.position[2],
      }),
      tilt: 75,
      heading: -feature.attributes.heading,
    });

    paragliderMesh.centerAt(point);
    paragliderMesh.transform = initialTransform?.clone();
    paragliderMesh.rotate(
      -feature.attributes.roll,
      0,
      feature.attributes.heading,
    );

    gauge.set(feature.attributes.speed);
    gauge2.set(feature.attributes.altitude);

    document.getElementById("dashboard-current")!.innerHTML =
      `Speed: ${feature.attributes.speed}   Altitude: ${feature.attributes.altitude}`;
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
