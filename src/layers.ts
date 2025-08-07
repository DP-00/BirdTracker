import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator";

import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Field from "@arcgis/core/layers/support/Field";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";
import LabelSymbol3D from "@arcgis/core/symbols/LabelSymbol3D";
import LineSymbol3D from "@arcgis/core/symbols/LineSymbol3D";
import LineSymbol3DLayer from "@arcgis/core/symbols/LineSymbol3DLayer";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import TextSymbol3DLayer from "@arcgis/core/symbols/TextSymbol3DLayer";
import { createSingleVisView } from "./dataLoading";
import { generateLayerFields } from "./singleVisualization";
import {
  getClosestFeatureIndexInTime,
  getClosestPointInTime,
  getCoordinatesFromFeatures,
} from "./utils";

// Esri color ramps - Falling Leaves
// const colors = [
//   "rgba(92, 152, 202, 1)",
//   "rgba(62, 117, 109, 1)",
//   "rgba(68, 73, 139, 1)",
//   "rgba(115, 36, 31, 1)",
//   "rgba(138, 81, 64, 1)",
//   "rgba(152, 149, 71, 1)",
// ];

// const colors = [
//   "rgba(139, 84, 75, 1)", // Muted brick red
//   "rgba(92, 112, 153, 1)", // Soft slate blue
//   "rgba(100, 140, 135, 1)", // Desaturated teal
//   "rgba(181, 162, 110, 1)", // Dusty gold
//   "rgba(168, 108, 129, 1)", // Soft mauve
//   "rgba(122, 134, 113, 1)", // Olive gray
//   "rgba(160, 123, 92, 1)", // Warm clay brown
// ];

const colors = [
  "rgba(95, 92, 160, 1)", // Warm clay brown
  "rgba(92, 134, 153, 1)", // Soft slate blue
  "rgba(100, 140, 103, 1)", // Desaturated teal
  "rgba(181, 144, 110, 1)", // Dusty gold
  "rgba(139, 75, 75, 1)", // Muted brick red
  "rgba(168, 108, 144, 1)", // Soft mauve
];

const specialKeys = new Set([
  "ObjectID",
  "birdid",
  "altitude",
  "speed",
  "timestamp",
  "longitude",
  "latitude",
]);

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
        text: `${summary?.type == "number" ? `<b>Path statistics</b><br> <b>Mean:</b> ${summary.mean}, <b>Min:</b> ${summary.min}, <b>Max:</b> ${summary.max} <br>` : ""}`,
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

export async function createGeneralizedLineLayer(
  groupedData: {
    [x: string]: any;
  },
  arcgisScene,
) {
  const lineGraphics = [];

  let i = 0;
  for (const birdid in groupedData) {
    const data = groupedData[birdid];
    if (data.length < 2) continue;

    let startDate = new Date(data[0].timestamp).getTime();
    let endDate = new Date(data[data.length - 1].timestamp).getTime();
    let color = colors[i % colors.length];

    const polyline = new Polyline({
      spatialReference: { wkid: 4326 },
      paths: data.map((pt: { longitude: any; latitude: any }) => [
        pt.longitude,
        pt.latitude,
      ]),
    });

    if (!geodeticLengthOperator.isLoaded()) {
      await geodeticLengthOperator.load();
    }

    const length = Math.floor(geodeticLengthOperator.execute(polyline) / 1000);

    const generalizedPolyline = await generalizeOperator.execute(
      polyline,
      0.003,
    );

    const lineGraphic = new Graphic({
      geometry: generalizedPolyline,
      attributes: {
        birdid,
        startDate,
        endDate,
        length,
        color,
      },
      symbol: new LineSymbol3D({
        symbolLayers: [
          new LineSymbol3DLayer({
            cap: "round",
            join: "round",
            material: {
              color: "#82b974ff",
              // @ts-ignore
              emissive: {
                strength: 3,
                source: "color",
              },
            },
            size: 5,
          }),
        ],
      }),
    });

    lineGraphics.push(lineGraphic);
    i++;
  }

  return new FeatureLayer({
    title: "Generlized visualization",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    legendEnabled: false,
    outFields: ["*"],
    fields: [
      { name: "ObjectID", type: "oid" },
      { name: "birdid", type: "string", alias: "Bird ID" },
      { name: "length", type: "integer", alias: "Path length (km)" },
      { name: "startDate", type: "date", alias: "Starting date" },
      { name: "endDate", type: "date", alias: "Finishing date" },
      { name: "color", type: "string" },
    ],
    popupTemplate: {
      title: "Bird {birdid}",
      outFields: ["*"],
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "length", label: "Path length (km)" },
            { fieldName: "startDate", label: "Starting date" },
            { fieldName: "endDate", label: "Finishing date" },
          ],
        },
        {
          type: "custom",
          creator: (event) => {
            const container = document.createElement("div");
            const button = document.createElement("calcite-button");
            button.id = "details-button";
            button.setAttribute("appearance", "outline");
            button.setAttribute("width", "full");
            button.innerText = "Investigate the track";
            const birdid = event.graphic.attributes.birdid;
            button.addEventListener("click", async () => {
              await createSingleVisView(arcgisScene, groupedData, birdid);
              arcgisScene.popup.close();
            });
            container.appendChild(button);
            return container;
          },
        },
      ],
    },
    elevationInfo: { mode: "on-the-ground" },
    opacity: 0.5,
    renderer: {
      type: "simple",
      symbol: new LineSymbol3D({
        symbolLayers: [
          new LineSymbol3DLayer({
            cap: "round",
            join: "round",
            material: {
              color: "#8a8f8dff",

              // @ts-ignore
              emissive: {
                strength: 3,
                source: "color",
              },
            },
            //   pattern: new LineStylePattern3D({
            //     style: "solid",
            //   }),
            size: 9,
          }),
          new LineSymbol3DLayer({
            cap: "round",
            join: "round",
            material: {
              color: "#2e2c2cff",
            },
            size: 6,
          }),
        ],
      }),
    },
  });
}
export async function createIconLayer(groupedData) {
  const iconLayer = new GraphicsLayer({
    title: "Icon visualization",
    maxScale: 100000,
    elevationInfo: {
      mode: "absolute-height",
    },
  });

  const lineGraphics = Object.entries(groupedData).map(([birdId], i) => {
    const color = colors[i % colors.length];

    return new Graphic({
      geometry: new Point({
        x: 0,
        y: 0,
        z: 0,
        spatialReference: { wkid: 4326 },
        hasZ: true,
      }),
      symbol: new PointSymbol3D({
        symbolLayers: [
          {
            type: "icon",
            size: "12",
            resource: {
              href: "./birdIcon3.svg",
            },
            material: {
              color: color,
            },
            angle: 180,
          },
        ],
      }),
      attributes: {
        birdId,
        color,
      },
    });
  });

  iconLayer.addMany(lineGraphics);

  return iconLayer;
}

export async function createGroupLineLayer(groupedData) {
  const groupLineLayer = new GraphicsLayer({
    title: "Group visualization",
    elevationInfo: {
      mode: "absolute-height",
    },
  });

  const lineGraphics = Object.entries(groupedData).map(([birdId], i) => {
    const color = colors[i % colors.length];

    return new Graphic({
      geometry: new Polyline({
        spatialReference: { wkid: 4326 },
        hasZ: true,
        paths: [
          [
            [0, 0, 0],
            [0.0001, 0.0001, 0],
          ],
        ],
      }),
      symbol: new LineSymbol3D({
        symbolLayers: [
          new LineSymbol3DLayer({
            material: {
              color: color,
              // @ts-ignore
              emissive: {
                strength: 2,
                source: "color",
              },
            },
            cap: "round",
            join: "round",
            size: 2,
          }),
        ],
      }),
      attributes: {
        birdId,
        color,
      },
    });
  });

  groupLineLayer.addMany(lineGraphics);

  return groupLineLayer;
}

export async function createLineLayer(
  // groupedData: { [x: string]: any },
  data,
  birdSummary: any,
) {
  const lineGraphics = [];
  let idCounter = 1;
  const allKeys = Object.keys(data[0]);

  for (let i = 0; i < data.length - 1; i++) {
    const startPoint = data[i];
    const endPoint = data[i + 1];
    if (!startPoint || !endPoint) continue;

    const altitude = (startPoint.altitude + endPoint.altitude) / 2;

    const attributes: any = {
      ObjectID: idCounter++,
      birdid: startPoint.birdid,
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
  // }

  const featureLayer = new FeatureLayer({
    id: "primaryLayer",
    title: "Line visualization",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: { mode: "absolute-height", offset: 3 },
    fields: generateLayerFields(birdSummary),
    outFields: ["*"],
    timeInfo: {
      startField: "timestamp",
      endField: "timestamp",
      interval: { value: 1, unit: "minutes" },
    },
    opacity: 0.75,
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
    title: "Cylinder visualization",
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
    opacity: 0.75,
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

export async function createTimeMarkersLayer(graphics) {
  if (!geodeticLengthOperator.isLoaded()) {
    await geodeticLengthOperator.load();
  }

  const graphicsArray = [];
  const coordinates = getCoordinatesFromFeatures(graphics);
  const startTimestamp = graphics[0].attributes.timestamp;
  const endTimestamp = graphics[graphics.length - 1].attributes.timestamp;

  const startDate = new Date(
    Date.UTC(
      new Date(startTimestamp).getUTCFullYear(),
      new Date(startTimestamp).getUTCMonth(),
      new Date(startTimestamp).getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

  const endDate = new Date(
    Date.UTC(
      new Date(endTimestamp).getUTCFullYear(),
      new Date(endTimestamp).getUTCMonth(),
      new Date(endTimestamp).getUTCDate(),
      23,
      59,
      59,
      0,
    ),
  );

  let prevIndex = 0;
  let i = 0;
  for (let d = startDate; d < endDate; d.setDate(d.getDate() + 1)) {
    let currentIndex = getClosestFeatureIndexInTime(graphics, d);
    let point = getClosestPointInTime(graphics, d, currentIndex);
    const line = new Polyline({
      spatialReference: { wkid: 4326 },
      paths: [
        coordinates
          .slice(prevIndex, currentIndex + 1)
          .concat([[point.x, point.y, point.z ?? 0]]),
      ],
    });

    const distance = Math.round(geodeticLengthOperator.execute(line) / 1000);

    graphicsArray.push(
      new Graphic({
        attributes: {
          OBJECTID: i + 1,
          distance,
          date: d.getTime() + 1,
        },
        geometry: graphics[currentIndex].geometry,
      }),
    );

    prevIndex = currentIndex;
    i++;
  }

  const labelingInfo = [
    new LabelClass({
      labelExpressionInfo: {
        expression:
          "var dateTime = $feature.date; return `${Upper(Text($feature.date, 'MMM D'))}\n${$feature.distance} km`",
      },
      labelPlacement: "center-right",
      symbol: new LabelSymbol3D({
        symbolLayers: [
          new TextSymbol3DLayer({
            material: {
              color: "#aed8cc",
            },
            background: {
              color: "#192a276e",
            },
            halo: {
              color: "#192a276e",
              size: 0,
            },
            font: {
              size: 8,
              weight: "normal",
              family: '"Avenir Next", "Avenir", "Helvetica Neue", sans-serif',
            },
          }),
        ],
      }),
    }),
  ];

  const getCanvasSymbol = (day: number) => {
    const canvas = document.createElement("canvas");
    const width = 25;
    const height = 25;
    canvas.setAttribute("width", width.toString() + "px");
    canvas.setAttribute("height", height.toString() + "px");
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#4c1010bb";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#aed8cc";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(day.toString(), width / 2, height / 2);
    return canvas.toDataURL("image/png");
  };

  const getUniqueValues = () => {
    const days = Array.from({ length: graphicsArray.length }, (_, i) => i + 1);
    return days.map((day) => {
      return {
        value: day,
        symbol: new PointSymbol3D({
          symbolLayers: [
            new IconSymbol3DLayer({
              resource: {
                href: getCanvasSymbol(day),
              },
              anchor: "relative",
              anchorPosition: {
                x: 0.5,
                y: -0.5,
              },
              size: 15,
            }),
          ],
          verticalOffset: {
            screenLength: 40,
            maxWorldLength: 500000,
            minWorldLength: 0,
          },
          callout: {
            type: "line",
            size: 1,
            color: "#192a27ff",
          },
        }),
      };
    });
  };

  const layer = new FeatureLayer({
    source: graphicsArray,
    title: "Time and distance visualization",
    geometryType: "point",
    spatialReference: SpatialReference.WGS84,
    popupEnabled: false,
    fields: [
      new Field({
        name: "OBJECTID",
        type: "oid",
      }),
      new Field({
        name: "date",
        type: "date",
      }),
      new Field({
        name: "distance",
        type: "double",
      }),
    ],
    labelingInfo,
    screenSizePerspectiveEnabled: false,
    renderer: new UniqueValueRenderer({
      field: "OBJECTID",
      defaultSymbol: new PointSymbol3D({
        symbolLayers: [new IconSymbol3DLayer({})],
      }),
      uniqueValueInfos: getUniqueValues(),
    }),
  });

  return layer;
}
