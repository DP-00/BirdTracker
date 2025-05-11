import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export function timeout(timeoutInMilliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutInMilliseconds);
  });
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
    title: "Generlized line",
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

export async function createLineLayer(groupedData: { [x: string]: any }) {
  const lineGraphics = [];
  let idCounter = 1;
  for (const birdid in groupedData) {
    const data = groupedData[birdid];

    for (let i = 0; i < data.length - 1; i++) {
      const startPoint = data[i];
      const endPoint = data[i + 1];
      if (!startPoint || !endPoint) continue;

      const altitude = (startPoint.altitude + endPoint.altitude) / 2;
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
        attributes: {
          ObjectID: idCounter++,
          birdid,
          altitude,
          speed: startPoint.speed,
          timestamp: new Date(startPoint.timestamp).getTime(),
          longitude: startPoint.longitude,
          latitude: startPoint.latitude,
        },
      });
      lineGraphics.push(lineGraphic);
    }
  }

  const featureLayer = new FeatureLayer({
    title: "Lines",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: { mode: "absolute-height" },
    fields: [
      { name: "ObjectID", type: "oid" },
      { name: "birdid", type: "string" },
      { name: "ColorIndex", type: "string" },
      { name: "longitude", type: "double" },
      { name: "latitude", type: "double" },
      { name: "timestamp", type: "date" },
      { name: "altitude", type: "double" },
      { name: "speed", type: "double" },
    ],
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
    },
  });

  return featureLayer;
}
