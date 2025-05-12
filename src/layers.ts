import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { generateLayerFields } from "./singleVisualization";
const popTemplate = {
  title: "Point Info",
  content:
    "Height  {height-above-ellipsoid} Longitude: {longitude}°<br> Latitude: {latitude}°<br> Altitude: {altitude} meters <br> Speed: {speed} meters ",
};

const specialKeys = new Set([
  "ObjectID",
  "birdid",
  "altitude",
  "speed",
  "timestamp",
  "longitude",
  "latitude",
]);

// const fields = [
//   { name: "ObjectID", type: "oid" },
//   { name: "birdid", type: "string" },
//   { name: "longitude", type: "double" },
//   { name: "latitude", type: "double" },
//   { name: "timestamp", type: "date" },
//   { name: "altitude", type: "double" },
//   { name: "speed", type: "double" },
// ];

export function createGraphics(csvData: any, birdid: string) {
  let idCounter = 1;
  // console.log("csvData", csvData);
  const allKeys = Object.keys(Object.values(csvData)[0]);
  // console.log("allKeys", allKeys);
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
    title: "Primary visualization",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: { mode: "absolute-height" },
    fields: generateLayerFields(birdSummary),
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
            size: 3,
            cap: "round",
            material: { color: [255, 0, 0] },
          },
        ],
      },
      visualVariables: [
        {
          type: "color",
          field: "altitude",
          stops: [
            {
              value: 1000,
              color: [0, 255, 0, 0.3],
            },
            {
              value: 1500,
              color: [255, 255, 0, 0.7],
            },
            {
              value: 2000,
              color: [255, 0, 0, 0.9],
            },
          ],
        },
      ],
    },
  });

  return featureLayer;
}

export function createCylinderLayer(graphics: any, birdSummary: any) {
  const featureLayer = new FeatureLayer({
    title: "Secondary visualization",
    source: graphics,
    objectIdField: "ObjectID",
    geometryType: "point",
    elevationInfo: {
      mode: "absolute-height",
    },
    minScale: 300000,
    fields: generateLayerFields(birdSummary),
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
            material: { color: [255, 0, 0] },
            width: 10,
            height: 3000,
            tilt: 180,
          },
        ],
      },
      visualVariables: [
        {
          type: "color",
          field: "speed",
          stops: [
            {
              value: 0,
              color: [0, 255, 0, 0.3],
            },
            {
              value: 10,
              color: [255, 255, 0, 0.7],
            },
            {
              value: 20,
              color: [255, 0, 0, 0.9],
            },
          ],
        },
      ],
    },
  });
  return featureLayer;
}
