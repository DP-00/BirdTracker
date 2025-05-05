import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator";
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export function timeout(timeoutInMilliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutInMilliseconds);
  });
}

export function processCSV(lines, columnNames) {
  const getColumnValue = (key) => {
    const column = columnNames[key];
    return typeof column === "string" ? column : column?.value;
  };

  let headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"(.*)"$/, "$1"));

  lines.pop(); // Remove the last line

  const groupedByBird = {};
  const statJSON = {};

  lines.slice(1).map((line) => {
    const values = line.split(",");
    let row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : "";
    });

    const birdid = row[getColumnValue("birdid")] ?? "unknown";
    const longitude = parseFloat(row[getColumnValue("longitude")]);
    const latitude = parseFloat(row[getColumnValue("latitude")]);
    const altitude = parseFloat(row[getColumnValue("altitude")]);
    const speed = parseFloat(row[getColumnValue("speed")]);
    const timestamp = new Date(row[getColumnValue("timestamp")]);

    if (
      isNaN(longitude) ||
      isNaN(latitude) ||
      (longitude === 0 && latitude === 0)
    ) {
      return null;
    }

    const dataPoint = {
      birdid,
      longitude,
      latitude,
      altitude,
      speed,
      timestamp,
      ...Object.fromEntries(
        headers
          .filter(
            (h) =>
              ![
                getColumnValue("birdid"),
                getColumnValue("longitude"),
                getColumnValue("latitude"),
                getColumnValue("altitude"),
                getColumnValue("speed"),
                getColumnValue("timestamp"),
              ].includes(h),
          )
          .map((h) => [h, row[h]]),
      ),
    };

    if (!groupedByBird[birdid]) groupedByBird[birdid] = [];
    groupedByBird[birdid].push(dataPoint);

    // Initialize statJSON for this bird if not exist
    if (!statJSON[birdid]) {
      statJSON[birdid] = {};
    }

    // Update statistics for numerical fields except longitude and latitude
    const numericalFields = Object.keys(dataPoint).filter((key) => {
      if (["longitude", "latitude", "birdid", "timestamp"].includes(key))
        return false;
      return typeof dataPoint[key] === "number" && !isNaN(dataPoint[key]);
    });

    numericalFields.forEach((field) => {
      if (!statJSON[birdid][field]) {
        statJSON[birdid][field] = {
          min: dataPoint[field],
          max: dataPoint[field],
          sum: dataPoint[field],
          count: 1,
        };
      } else {
        const stats = statJSON[birdid][field];
        stats.min = Math.min(stats.min, dataPoint[field]);
        stats.max = Math.max(stats.max, dataPoint[field]);
        stats.sum += dataPoint[field];
        stats.count += 1;
      }
    });
  });

  // After processing all lines, calculate mean
  for (const birdid in statJSON) {
    for (const field in statJSON[birdid]) {
      const stats = statJSON[birdid][field];
      stats.mean = parseFloat((stats.sum / stats.count).toFixed(2));
      stats.min = parseFloat(stats.min.toFixed(2));
      stats.max = parseFloat(stats.max.toFixed(2));
      delete stats.sum;
      delete stats.count;
    }
  }

  console.log(statJSON);

  return [groupedByBird, statJSON]; // return grouped data
}

export async function createGeneralizedLineLayer(groupedData) {
  const lineGraphics = [];

  for (const birdid in groupedData) {
    const data = groupedData[birdid];
    if (data.length < 2) continue;

    const polyline = new Polyline({
      spatialReference: {
        wkid: 4326,
      },
      paths: data.map((pt) => [pt.longitude, pt.latitude]),
    });

    const generalizedPolyline = await generalizeOperator.execute(
      polyline,
      0.005,
    );

    const lineGraphic = new Graphic({
      geometry: generalizedPolyline,
    });

    console.log(lineGraphic);
    lineGraphics.push(lineGraphic);
  }

  return new FeatureLayer({
    title: "Generlized line",
    source: lineGraphics,
    objectIdField: "ObjectID",
    geometryType: "polyline",
    elevationInfo: {
      mode: "on-the-ground",
    },
    maxScale: 300000,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-line",
        color: [70, 70, 70, 0.5],
        width: 10,
      },
    },
  });
}

export function createLineLayer(groupedData) {
  const timeInfo = {
    startField: "timestamp",
    endField: "timestamp",
    interval: {
      value: 1,
      unit: "minutes",
    },
  };

  const fields = [
    {
      name: "ObjectID",
      type: "oid",
    },
    { name: "birdid", type: "string" },
    { name: "ColorIndex", type: "string" },
    {
      name: "longitude",
      type: "double",
    },
    {
      name: "latitude",
      type: "double",
    },
    {
      name: "timestamp",
      type: "date",
    },
    {
      name: "altitude",
      type: "double",
    },
    {
      name: "speed",
      type: "double",
    },
  ];

  const colorRamp = [
    [255, 0, 0], // red
    [0, 255, 0], // green
    [0, 0, 255], // blue
    [255, 255, 0], // yellow
    [255, 0, 255], // magenta
    [0, 255, 255], // cyan
    [128, 0, 128], // purple
    [255, 165, 0], // orange
    [0, 128, 128], // teal
    [128, 128, 0], // olive
  ];

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
          colorIndex: colorRamp[idCounter],
          speed: startPoint.speed,
          timestamp: startPoint.timestamp.getTime(),
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
    elevationInfo: {
      mode: "absolute-height",
    },
    fields,
    timeInfo,
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
          // valueExpression: `return "#00FF00";`,
          stops: colorRamp.map((color, index) => ({
            value: index,
            color: color,
          })),
          // field: "birdid",
        },
      ],
    },
  });

  return featureLayer;
}

function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 50%)`;
}
