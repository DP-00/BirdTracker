import * as geodeticDistanceOperator from "@arcgis/core/geometry/operators/geodeticDistanceOperator";
import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator";

import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";

import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import Field from "@arcgis/core/layers/support/Field";
import LabelClass from "@arcgis/core/layers/support/LabelClass";
import UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";
import LabelSymbol3D from "@arcgis/core/symbols/LabelSymbol3D";
import LineSymbol3D from "@arcgis/core/symbols/LineSymbol3D";
import LineSymbol3DLayer from "@arcgis/core/symbols/LineSymbol3DLayer";
import LineStylePattern3D from "@arcgis/core/symbols/patterns/LineStylePattern3D.js";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import TextSymbol3DLayer from "@arcgis/core/symbols/TextSymbol3DLayer";
import { createSingleVisView } from "./dataLoading";
import { generateLayerFields } from "./singleVisualization";

// Esri color ramps - Falling Leaves
const colors = [
  "rgba(115, 36, 31, 1)",
  "rgba(68, 73, 139, 1)",
  "rgba(92, 152, 202, 1)",
  "rgba(62, 117, 109, 1)",
  "rgba(217, 215, 140, 1)",
  "rgba(184, 107, 83, 1)",
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
      0.001,
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
            button.innerText = "Investigate the path";

            const birdid = event.graphic.attributes.birdid;
            button.addEventListener("click", async () => {
              await createSingleVisView(arcgisScene, groupedData, birdid);
              arcgisScene.popup.close(); // Collapse the popup after action
            });

            container.appendChild(button);
            return container;
          },
        },
      ],
    },
    elevationInfo: { mode: "on-the-ground" },
    renderer: {
      type: "simple",
      symbol: new LineSymbol3D({
        symbolLayers: [
          new LineSymbol3DLayer({
            cap: "round",
            join: "round",
            material: {
              color: "#192a27b5",
            },
            pattern: new LineStylePattern3D({
              style: "solid",
            }),
            size: 4,
          }),

          new LineSymbol3DLayer({
            cap: "round",
            join: "round",
            material: {
              color: "#aed8cc3b",
            },
            pattern: new LineStylePattern3D({
              style: "solid",
            }),
            size: 2,
          }),
        ],
      }),
      // { type: "simple-line", color: [80, 80, 80, 1], width: 4 },
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
            size: 3,
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
  // const firstBirdId = Object.keys(groupedData)[0];
  // const allKeys = Object.keys(groupedData[firstBirdId][0]);
  const allKeys = Object.keys(data[0]);

  // for (const birdid in groupedData) {
  // const data = groupedData[birdid];

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
    // popupTemplate: popupTemplate,
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
    // popupTemplate: popTemplate,
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

export async function createTimeLayer(graphics) {
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

  const layers = [];

  for (const config of intervals) {
    const { label, interval, title, minScale, maxScale } = config;
    const graphicsArray = [];

    let lastTimestamp = null;
    let firstTimestamp = null;
    let lastPoint = null;
    let accumulatedDistance = 0;

    for (const g of graphics) {
      if (!firstTimestamp) firstTimestamp = g.attributes.timestamp;
      const currentTimestamp = g.attributes.timestamp;
      const currentPoint = g.geometry;

      let distanceFromLast = 0;
      if (lastPoint) {
        if (!geodeticDistanceOperator.isLoaded()) {
          await geodeticDistanceOperator.load();
        }

        distanceFromLast = geodeticDistanceOperator.execute(
          lastPoint,
          currentPoint,
        );

        distanceFromLast = distanceFromLast / 1000;
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
            ? `${days}d ${hours}h | +${Math.round(distanceFromLast)} km`
            : // : `${days} \ue64e +${Math.round(distanceFromLast)} (${Math.round(accumulatedDistance)}) km`;
              `${days}d | +${Math.round(distanceFromLast)} km`;

        graphicsArray.push(
          new Graphic({
            geometry: currentPoint,
            attributes: { timestamp: currentTimestamp },
            symbol: new TextSymbol({
              text,
              color: [14, 22, 21],
              haloColor: [125, 149, 139, 0.5],
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
    }

    const layer = new GraphicsLayer({
      title,
      minScale,
      maxScale,
    });

    layer.addMany(graphicsArray);
    layers.push(layer);
  }

  return layers;
}

export async function createTimeMarkersLayer(graphics) {
  // const intervals = [
  //   {
  //     label: "Hour",
  //     interval: 60 * 60 * 1000,
  //     title: "Time and distance visualization (hours)",
  //     minScale: 300000,
  //   },
  //   {
  //     label: "Day",
  //     interval: 24 * 60 * 60 * 1000,
  //     title: "Time and distance visualization (days)",
  //     maxScale: 300000,
  //   },
  // ];

  let label = "Day";
  let interval = 24 * 60 * 60 * 1000;
  let title = "Time and distance visualization (hours)";
  // let minScale = 300000;
  const layers = [];

  // for (const config of intervals) {
  // const { label, interval, title, minScale, maxScale } = config;
  const graphicsArray = [];

  let lastTimestamp = null;
  let firstTimestamp = null;
  let lastPoint = null;
  let accumulatedDistance = 0;
  let i = 0;
  for (const g of graphics) {
    if (!firstTimestamp) firstTimestamp = g.attributes.timestamp;
    const currentTimestamp = g.attributes.timestamp;
    const currentPoint = g.geometry;

    let distanceFromLast = 0;
    if (lastPoint) {
      if (!geodeticDistanceOperator.isLoaded()) {
        await geodeticDistanceOperator.load();
      }

      distanceFromLast = geodeticDistanceOperator.execute(
        lastPoint,
        currentPoint,
      );

      distanceFromLast = distanceFromLast / 1000;
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
          ? `${days}d ${hours}h | +${Math.round(distanceFromLast)} km`
          : // : `${days} \ue64e +${Math.round(distanceFromLast)} (${Math.round(accumulatedDistance)}) km`;
            `${days}d | +${Math.round(distanceFromLast)} km`;

      graphicsArray.push(
        new Graphic({
          geometry: currentPoint,
          attributes: {
            OBJECTID: i + 1,
            date: currentTimestamp,
            distance: Math.round(distanceFromLast),
          },
        }),
      );
      i++;
    }
  }

  const labelingInfo = [
    new LabelClass({
      labelExpressionInfo: {
        expression:
          "var dateTime = $feature.date; var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'OCT', 'Nov', 'Dec']; return `${months[Month(dateTime)]} ${Day(dateTime)}\n${$feature.distance} km`",
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
    console.log("canvDay", day);
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
    const days = Array.from({ length: graphicsArray.length }, (_, i) => i + 1); // generating icons for a trip of 2 months
    console.log("days", days);
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
    title: title,
    // minScale,
    // maxScale,
    geometryType: "point",
    spatialReference: SpatialReference.WGS84,
    objectIdField: "OBJECTID",
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
      new Field({
        name: "id",
        type: "double",
      }),
    ],
    labelingInfo,
    screenSizePerspectiveEnabled: false,
    renderer: new UniqueValueRenderer({
      field: "OBJECTID",
      defaultSymbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            resource: {
              primitive: "square",
            },
            material: {
              color: "red",
            },
            size: 10,
          }),
        ],
      }),
      uniqueValueInfos: getUniqueValues(),
    }),
  });

  // layer.addMany(graphicsArray);
  layers.push(layer);
  // }

  return layer;
}
