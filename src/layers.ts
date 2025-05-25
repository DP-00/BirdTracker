import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { generateLayerFields } from "./singleVisualization";

// Create the popupTemplate dynamically
export function createDynamicPopupTemplate(
  layer: FeatureLayer,
  activeVariable: string,
  birdSummary,
) {
  const fieldInfos = layer.fields
    .filter((f) => f.type !== "oid" && f.type !== "geometry")
    .map((f) => ({ fieldName: f.name }));

  const summary = birdSummary[activeVariable];

  const popupTemplate = {
    title: `<b>${activeVariable.toUpperCase()}:</b> {${activeVariable}}`,
    content: [
      {
        type: "text",
        text: `${summary?.type == "number" ? `<b>Mean:</b> ${summary.mean}, <b>Min:</b> ${summary.min}, <b>Max:</b> ${summary.max} <br>` : ""}`,
      },
      {
        type: "text",
        text: "<b>Date:</b> {timestamp} <br>  <b>Location:</b> {longitude}, {latitude}, {altitude}  <br><br> <b>Other variables:</b>",
      },
      {
        type: "fields",
        fieldInfos,
      },
    ],
  };

  layer.popupTemplate = popupTemplate;
}

const specialKeys = new Set([
  "ObjectID",
  "birdid",
  "altitude",
  "speed",
  "timestamp",
  "longitude",
  "latitude",
]);

export function createGraphics(csvData: any) {
  let idCounter = 1;
  const allKeys = Object.keys(Object.values(csvData)[0]);
  let birdid = Object.values(csvData)[0].birdid;

  const graphics = csvData.map((point: any, index: number) => {
    const attributes: any = {
      ObjectID: idCounter++,
      birdid,
      altitude: point.altitude,
      speed: point.speed,
      timestamp: new Date(point.timestamp).getTime(),
      longitude: point.longitude,
      latitude: point.latitude,
    };

    for (const key of allKeys) {
      if (!specialKeys.has(key)) {
        attributes[key] = point[key];
      }
    }

    return new Graphic({
      geometry: {
        type: "point",
        longitude: point.longitude,
        latitude: point.latitude,
        z: point.altitude,
      },
      attributes,
    });
  });
  return graphics;
}

export async function createGeneralizedLineLayer(groupedData: {
  [x: string]: any;
}) {
  const lineGraphics = [];

  for (const birdid in groupedData) {
    const data = groupedData[birdid];
    if (data.length < 2) continue;

    const polyline = new Polyline({
      spatialReference: { wkid: 4326 },
      paths: data.map((pt: { longitude: any; latitude: any }) => [
        pt.longitude,
        pt.latitude,
      ]),
    });

    const generalizedPolyline = await generalizeOperator.execute(
      polyline,
      0.005,
    );

    const lineGraphic = new Graphic({ geometry: generalizedPolyline });

    lineGraphics.push(lineGraphic);
  }

  return new FeatureLayer({
    title: "Generlized visualization",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: { mode: "on-the-ground" },
    maxScale: 300000,
    popupEnabled: false,
    renderer: {
      type: "simple",
      symbol: { type: "simple-line", color: [70, 70, 70, 0.5], width: 10 },
    },
  });
}

export async function createLineLayer(
  groupedData: { [x: string]: any },
  birdSummary: any,
) {
  const lineGraphics = [];
  let idCounter = 1;
  const firstBirdId = Object.keys(groupedData)[0];
  const allKeys = Object.keys(groupedData[firstBirdId][0]);

  for (const birdid in groupedData) {
    const data = groupedData[birdid];

    for (let i = 0; i < data.length - 1; i++) {
      const startPoint = data[i];
      const endPoint = data[i + 1];
      if (!startPoint || !endPoint) continue;

      const altitude = (startPoint.altitude + endPoint.altitude) / 2;

      const attributes: any = {
        ObjectID: idCounter++,
        birdid,
        altitude,
        speed: startPoint.speed,
        timestamp: new Date(startPoint.timestamp).getTime(),
        longitude: startPoint.longitude,
        latitude: startPoint.latitude,
      };

      for (const key of allKeys) {
        if (!specialKeys.has(key)) {
          attributes[key] = startPoint[key];
        }
      }

      const lineGraphic = new Graphic({
        geometry: {
          type: "polyline",
          paths: [
            [
              [startPoint.longitude, startPoint.latitude, startPoint.altitude],
              [endPoint.longitude, endPoint.latitude, endPoint.altitude],
            ],
          ],
          spatialReference: { wkid: 4326 },
        },
        attributes,
      });
      lineGraphics.push(lineGraphic);
    }
  }

  const featureLayer = new FeatureLayer({
    id: "primaryLayer",
    title: "Primary visualization",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: { mode: "absolute-height", offset: 3 },
    fields: generateLayerFields(birdSummary),
    outFields: ["*"],
    // popupTemplate: popupTemplate,
    timeInfo: {
      startField: "timestamp",
      endField: "timestamp",
      interval: { value: 1, unit: "minutes" },
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            size: 6,
            cap: "round",
            material: { color: [104, 0, 0] },
          },
        ],
      },
    },
  });

  return featureLayer;
}

export function createCylinderLayer(graphics: any, birdSummary: any) {
  const featureLayer = new FeatureLayer({
    id: "secondaryLayer",
    title: "Secondary visualization",
    source: graphics,
    objectIdField: "ObjectID",
    geometryType: "point",
    elevationInfo: {
      mode: "absolute-height",
    },
    // minScale: 300000,
    fields: generateLayerFields(birdSummary),
    outFields: ["*"],
    timeInfo: {
      startField: "timestamp",
      endField: "timestamp",
      interval: { value: 1, unit: "minutes" },
    },
    // popupTemplate: popTemplate,
    renderer: {
      type: "simple",
      symbol: {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            resource: {
              primitive: "cylinder",
            },
            material: { color: [104, 0, 0] },
            width: 10,
            height: 3000,
            tilt: 180,
          },
        ],
      },
    },
  });
  return featureLayer;
}

export function createTimeLayer(graphics) {
  const intervals = [
    {
      label: "Hour",
      interval: 60 * 60 * 1000,
      title: "Time and distance visualization (hours)",
      minScale: 300000,
    },
    {
      label: "Day",
      interval: 24 * 60 * 60 * 1000,
      title: "Time and distance visualization (days)",
      maxScale: 300000,
    },
  ];
  return intervals.map(({ label, interval, title, minScale, maxScale }) => {
    let lastTimestamp = null;
    let firstTimestamp = null;
    let lastPoint = null;
    let accumulatedDistance = 0;
    const timeGraphic: Graphic[] = [];
    graphics.forEach((g) => {
      if (!firstTimestamp) firstTimestamp = g.attributes.timestamp;
      const currentTimestamp = g.attributes.timestamp;
      const currentPoint = g.geometry;

      let distanceFromLast = 0;
      if (lastPoint) {
        const lastWeb = webMercatorUtils.geographicToWebMercator(lastPoint);
        const currentWeb =
          webMercatorUtils.geographicToWebMercator(currentPoint);

        distanceFromLast =
          geometryEngine.distance(lastWeb, currentWeb, "kilometers") || 0;
      }

      if (!lastTimestamp || currentTimestamp - lastTimestamp >= interval) {
        accumulatedDistance += distanceFromLast;
        lastTimestamp = currentTimestamp;
        lastPoint = currentPoint;
        let durationInSeconds = (currentTimestamp - firstTimestamp) / 1000;
        let days = Math.floor(durationInSeconds / 86400);
        let hours = Math.floor((durationInSeconds % 86400) / 3600);
        let text =
          label === "Hour"
            ? `${days}d ${hours}h \ue63f +${distanceFromLast.toFixed(0)} (${accumulatedDistance.toFixed(0)})km`
            : `${days} \ue63f +${distanceFromLast.toFixed(0)} (${accumulatedDistance.toFixed(0)})km`;

        timeGraphic.push(
          new Graphic({
            geometry: currentPoint,
            symbol: new TextSymbol({
              text: text,
              color: [30, 30, 30],
              haloColor: [150, 150, 150, 0.5],
              haloSize: 1.5,
              font: {
                size: 10,
                family: "CalciteWebCoreIcons",
                weight: "bold",
              },
            }),
          }),
        );
      }
    });

    const timeLayer = new GraphicsLayer({
      title,
      minScale,
      maxScale,
    });
    timeGraphic.forEach((g) => timeLayer.add(g));

    return timeLayer;
  });
}
