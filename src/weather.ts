import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// Setting the infromation to be displayed in the popup
const popTemplate = {
  title: "{parameter}: {weatherValue}",
  content:
    "Date:  {timestamp} <br>  <b>Location:</b> {longitude}, {latitude}, {altitude} ",
};
// Setting field names and type for both feature layers
const fields = [
  {
    name: "ObjectID",
    type: "oid",
  },
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
    name: "parameter",
    type: "string",
  },
  {
    name: "weatherValue",
    type: "double",
  },
];

const temperatureVariables = [
  {
    type: "color",
    field: "weatherValue",
    stops: [
      { value: -30, color: "rgba(5, 48, 97, 0.7)" },
      { value: -20, color: "rgba(33, 102, 172, 0.7)" },
      { value: -15, color: "rgba(67, 147, 195, 0.7)" },
      { value: -10, color: "rgba(146, 197, 222, 0.7)" },
      { value: -5, color: "rgba(209, 229, 240, 0.7)" },
      { value: 0, color: "rgba(253, 219, 199, 0.7)" },
      { value: 5, color: "rgba(244, 165, 130, 0.7)" },
      { value: 10, color: "rgba(214, 96, 77, 0.7)" },
      { value: 20, color: "rgba(178, 24, 43, 0.7)" },
      { value: 30, color: "rgba(103, 0, 31, 0.7)" },
    ],
  },
];

// Esri color ramps - Purple 4
const colors = [
  "rgba(247, 252, 253, 1)",
  "rgba(224, 236, 244, 1)",
  "rgba(191, 211, 230, 1)",
  "rgba(158, 188, 218, 1)",
  "rgba(140, 150, 198, 1)",
  "rgba(140, 107, 177, 1)",
  "rgba(136, 65, 157, 1)",
  "rgba(129, 15, 124, 1)",
  "rgba(104, 0, 102, 1)",
  "rgba(63, 1, 63, 1)",
];

// https://www.baranidesign.com/faq-articles/2020/1/19/rain-rate-intensity-classification
const precipitationVariables = [
  {
    type: "color",
    field: "weatherValue",
    stops: [
      { value: 0, color: colors[0] },
      { value: 1, color: colors[2] },
      { value: 3, color: colors[4] },
      { value: 8, color: colors[6] },
      { value: 50, color: colors[8] },
    ],
  },
];

// https://www.noaa.gov/jetstream/atmosphere/air-pressure#:~:text=Millibar%20values%20used%20in%20meteorology,pressure%20is%20almost%20always%20changing.
const pressureVariables = [
  {
    type: "color",
    field: "weatherValue",
    stops: [
      { value: 600, color: colors[0] },
      { value: 750, color: colors[1] },
      { value: 700, color: colors[2] },
      { value: 750, color: colors[3] },
      { value: 800, color: colors[4] },
      { value: 850, color: colors[5] },
      { value: 900, color: colors[6] },
      { value: 950, color: colors[7] },
      { value: 1000, color: colors[8] },
      { value: 1050, color: colors[9] },
    ],
  },
];
// https://www.rmets.org/metmatters/beaufort-wind-scale
const windSpeedVariables = [
  {
    type: "color",
    field: "weatherValue",
    stops: [
      { value: 5, color: colors[0] },
      { value: 11, color: colors[1] },
      { value: 19, color: colors[2] },
      { value: 28, color: colors[3] },
      { value: 38, color: colors[4] },
      { value: 49, color: colors[5] },
      { value: 61, color: colors[6] },
      { value: 74, color: colors[7] },
      { value: 88, color: colors[8] },
      { value: 102, color: colors[9] },
    ],
  },
];

export async function setWeather(arcgisScene, secondaryLayer, polylineLayer) {
  const weatherSelect = document.getElementById(
    "weather-select",
  ) as HTMLCalciteSelectElement;
  const buttonWeather = document.getElementById(
    "weather-button",
  )! as HTMLCalciteButtonElement;
  let weatherLayer: FeatureLayer;
  weatherLayer = await createWeatherLayer(arcgisScene);
  console.log("wl", weatherLayer);
  buttonWeather?.addEventListener("click", async () => {
    await updateWeatherLayer(
      arcgisScene,
      secondaryLayer,
      weatherLayer,
      weatherSelect.value,
      polylineLayer,
    );
  });
}

export async function createWeatherLayer(arcgisScene) {
  let weatherLayer = new FeatureLayer({
    id: "weatherLayer",
    title: "Weather visualization",
    source: [], // initially empty
    objectIdField: "ObjectID",
    geometryType: "polygon",
    fields: fields,
    timeInfo: {
      startField: "timestamp",
      endField: "timestamp",
      interval: {
        value: 1,
        unit: "minutes",
      },
    },
    popupTemplate: popTemplate,
    elevationInfo: {
      mode: "on-the-ground",
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "polygon-3d",
        symbolLayers: [
          {
            type: "fill",
            material: { color: [0, 0, 0, 0.5] },
          },
        ],
      },
      visualVariables: temperatureVariables,
    },
  });

  await arcgisScene.addLayers([weatherLayer]);
  return weatherLayer;
}

async function updateWeatherLayer(
  arcgisScene,
  layer,
  weatherLayer,
  variable,
  polylineLayer,
) {
  const weatherGraphics = [];
  let parameter;
  let weatherVariables;
  // let parameter = "temperature_2m";
  // let weatherVariables = temperatureVariables;
  switch (variable) {
    case "None": {
      parameter = "";
      break;
    }
    case "Temperature": {
      parameter = "temperature_2m";
      weatherVariables = temperatureVariables;

      break;
    }
    case "Pressure": {
      parameter = "surface_pressure";
      weatherVariables = pressureVariables;

      break;
    }
    case "Precipitation": {
      parameter = "precipitation";
      weatherVariables = precipitationVariables;

      break;
    }
    case "Wind 10": {
      parameter = "wind_speed_10m";
      weatherVariables = windSpeedVariables;
      break;
    }
    case "Wind 100": {
      parameter = "wind_speed_100m";
      weatherVariables = windSpeedVariables;
      break;
    }
  }

  try {
    const layerView = await arcgisScene.view.whenLayerView(layer);
    await reactiveUtils.whenOnce(() => !layerView.dataUpdating);
    const features = await layerView.queryFeatures({
      geometry: arcgisScene.view.extent,
      returnGeometry: true,
      orderByFields: ["ObjectID"],
    });

    const featureExtent = await layerView.queryExtent();
    const tiles = await generateWeatherExtent(
      featureExtent,
      arcgisScene,
      polylineLayer,
    );

    // const graphics = getSampledGraphics(features.features);
    // createBufferedAreaFromPoints(features.features, arcgisScene);

    // for (const g of graphics){
    for (const tile of tiles) {
      let timestamp = new Date(2022, 11, 17, 3, 24, 0);
      try {
        // const weatherValue = await getWeather(
        //   tile.geometry,
        //   timestamp,
        //   parameter,
        // );
        const weatherValue = Math.random() * 60 - 30;

        if (weatherValue !== null && weatherValue !== undefined) {
          let graphic = new Graphic({
            geometry: tile.geometry,
            attributes: {
              ObjectID: weatherGraphics.length + 1,
              longitude: tile.geometry.centroid.longitude,
              latitude: tile.geometry.centroid.latitude,
              parameter: parameter,
              weatherValue: weatherValue,
              timestamp: timestamp.getTime(),
            },
          });
          weatherGraphics.push(graphic);
          arcgisScene.view.graphics.add(graphic); // works when adding here, but not visble in weathetLayer

          //       const square = createSquareAroundPoint(g.geometry);
          //       weatherGraphics.push(
          //         new Graphic({
          //           geometry: square,
          //           attributes: {
          //             ObjectID: weatherGraphics.length + 1,
          //             longitude: g.geometry.longitude,
          //             latitude: g.geometry.latitude,
          //             parameter: parameter,
          //             weatherValue: weatherValue,
          //             timestamp: timestamp.getTime(),
          //           },
          //         }),
          //       );
        } else {
          console.warn("No weather value returned.");
        }
      } catch (err) {
        console.warn("Weather API error:", err);
      }
    }

    console.log("wg", weatherGraphics);
    const existing = await weatherLayer.queryFeatures();
    const deleteFeatures = Array.isArray(existing.features)
      ? existing.features
      : [];
    await weatherLayer.applyEdits({
      deleteFeatures,
    });

    await weatherLayer.applyEdits({
      addFeatures: weatherGraphics,
    });

    await weatherLayer.when();
    await arcgisScene.view.goTo(weatherLayer.fullExtent); // go to the whole globe, no layer extent
    const result2 = await weatherLayer.queryFeatures();
    console.log("Feature count after add:", result2.features.length); // correct amount
    console.log("After add:", weatherLayer.source.length); // 0
    console.log("weatherLayer", weatherLayer);

    weatherLayer.renderer.visualVariables = weatherVariables;

    console.log("weatherLayer renderer", weatherLayer.renderer.visualVariables);
  } catch (error) {
    console.error("Error while updating weather layer:", error);
  }
}

export async function generateWeatherExtent(
  featureExtent,
  arcgisScene,
  polylineLayer,
) {
  console.log("e", featureExtent);

  const polygon = new Polygon({
    rings: [
      [featureExtent.extent.xmin - 3, featureExtent.extent.ymin - 3],
      [featureExtent.extent.xmin - 3, featureExtent.extent.ymax + 3],
      [featureExtent.extent.xmax + 3, featureExtent.extent.ymax + 3],
      [featureExtent.extent.xmax + 3, featureExtent.extent.ymin - 3],
      [featureExtent.extent.xmin - 3, featureExtent.extent.ymin - 3],
    ],
    spatialReference: { wkid: 3857 },
  });

  // arcgisScene.view.graphics.add(graphic);

  const tiles = await generateTiles(arcgisScene, polygon, polylineLayer);
  console.log(tiles);
  return tiles;
}

async function generateTiles(arcgisScene, polygon, polylineLayer) {
  const step = 4000;
  const extent = polygon.extent;

  const xmin = extent.xmin;
  const xmax = extent.xmax;
  const ymin = extent.ymin;
  const ymax = extent.ymax;

  const polylineFeatureSet = await polylineLayer.queryFeatures({
    returnGeometry: true,
    where: "1=1",
  });
  const polylineWGS84 = polylineFeatureSet.features[0].geometry;
  const polyline = webMercatorUtils.geographicToWebMercator(polylineWGS84);
  console.log("line", polyline);
  const tiles = [];
  let counter = 0;
  for (let x = xmin; x < xmax; x += step) {
    for (let y = ymin; y < ymax; y += step) {
      const tileCenter = new Point({
        x: x + step / 2,
        y: y + step / 2,
        spatialReference: polygon.spatialReference,
      });

      const distanceToLine = geometryEngine.distance(
        tileCenter,
        polyline,
        "kilometers",
      );

      if (distanceToLine !== null && distanceToLine <= 7) {
        const tilePolygon = new Polygon({
          rings: [
            [x, y],
            [x + step, y],
            [x + step, y + step],
            [x, y + step],
            [x, y],
          ],
          spatialReference: polygon.spatialReference,
        });
        counter++;

        let tile = new Graphic({
          geometry: tilePolygon,
          symbol: {
            type: "simple-fill",
            color: getRandomColorRGBA(0.4),
          },
        });

        tiles.push(tile);

        // arcgisScene.view.graphics.add(tile);
      }
    }
  }
  console.log("nr of tiles", counter);

  return tiles;
}

function getRandomColorRGBA(alpha = 1) {
  const r = Math.floor(Math.random() * 200);
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return [r, g, b, alpha];
}

async function getWeather(point, timestamp, parameter) {
  const dateStr = timestamp.toISOString().split("T")[0]; // yyyy-mm-dd
  const apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${point.latitude}&longitude=${point.longitude}&start_date=${dateStr}&end_date=${dateStr}&hourly=${parameter}&timezone=UTC`;
  const res = await fetch(apiUrl);
  const data = await res.json();

  if (!data.hourly[parameter] || !data.hourly.time) return;

  const times = data.hourly.time;
  const temps = data.hourly[parameter];

  const targetHour = timestamp.toISOString().slice(0, 13); // yyyy-mm-ddThh

  const index = times.findIndex((t) => t.startsWith(targetHour));
  const temp = index >= 0 ? temps[index] : null;

  return temp;
}

// ----- ARCHIVE -------

function getSampledGraphics(graphics, minDistanceKm = 4) {
  const sampled = [];
  let lastPoint = null;
  let lastTimestamp = null;
  let sampleInterval = 1000;

  for (let i = 0; i < graphics.length; i += sampleInterval) {
    const g = graphics[i];
    const currentTimestamp = g.attributes.timestamp;
    const currentPoint = g.geometry;

    let distanceFromLast = 0;
    if (lastPoint) {
      const lastWeb = webMercatorUtils.geographicToWebMercator(lastPoint);
      const currentWeb = webMercatorUtils.geographicToWebMercator(currentPoint);
      distanceFromLast =
        geometryEngine.distance(lastWeb, currentWeb, "kilometers") || 0;
    }

    if (!lastTimestamp || distanceFromLast >= minDistanceKm) {
      lastTimestamp = currentTimestamp;
      lastPoint = currentPoint;
      sampled.push(g);
    }
  }

  return sampled;
}

function createSquareAroundPoint(point: Point): Polygon {
  //  diagonal of 2 km square ≈ 2 * sqrt(2) / 2 = 1.414 km
  const buffer = geometryEngine.geodesicBuffer(point, 1.414, "kilometers");
  const envelope = buffer.extent;
  const { xmin, ymin, xmax, ymax } = envelope;

  const square = new Polygon({
    rings: [
      [xmin, ymin],
      [xmax, ymin],
      [xmax, ymax],
      [xmin, ymax],
      [xmin, ymin],
    ],
    spatialReference: point.spatialReference,
  });

  return square;
}

function createBufferedAreaFromPoints(pointFeatures, arcgisScene) {
  if (!pointFeatures.length) return;

  const spatialRef = pointFeatures[0].geometry.spatialReference;
  const coords = pointFeatures.map((f) => [
    f.geometry.longitude,
    f.geometry.latitude,
  ]);

  const multipoint = new Multipoint({
    points: coords,
    spatialReference: spatialRef,
  });

  const webMercator = webMercatorUtils.geographicToWebMercator(multipoint);

  const buffer = geometryEngine.buffer(webMercator, 3, "kilometers");

  let graphic = new Graphic({
    geometry: buffer,
    symbol: {
      type: "simple-fill",
      color: [255, 0, 0, 0.5],
    },
  });

  arcgisScene.view.graphics.add(graphic);
}

// export async function createWeatherLayer(graphics, variable) {
//   let interval = 60 * 60 * 1000;
//   let minScale = 300000;
//   let lastTimestamp = null;
//   let firstTimestamp = null;
//   let lastPoint = null;
//   let accumulatedDistance = 0;
//   const weatherGraphics = [];
//   let parameter = "temperature_2m";
//   let weatherVariables = temperatureVariables;

//   try {
//     for (const g of graphics) {
//       if (!firstTimestamp) firstTimestamp = g.attributes.timestamp;
//       const currentTimestamp = g.attributes.timestamp;
//       const currentPoint = g.geometry;

//       let distanceFromLast = 0;
//       if (lastPoint) {
//         const lastWeb = webMercatorUtils.geographicToWebMercator(lastPoint);
//         const currentWeb =
//           webMercatorUtils.geographicToWebMercator(currentPoint);

//         distanceFromLast =
//           geometryEngine.distance(lastWeb, currentWeb, "kilometers") || 0;
//       }

//       //   if (!lastTimestamp || currentTimestamp - lastTimestamp >= interval) {
//       if (!lastTimestamp || distanceFromLast >= 4) {
//         accumulatedDistance += distanceFromLast;
//         lastTimestamp = currentTimestamp;
//         lastPoint = currentPoint;
//         const timestamp = new Date(currentTimestamp);
//         // const temp = Math.random() * 60 - 30;
//         let weatherValue = await getWeather(currentPoint, timestamp, parameter);
//         // console.log("w", weatherValue);
//         const square = createSquareAroundPoint(currentPoint);
//         weatherGraphics.push(
//           new Graphic({
//             geometry: square,
//             attributes: {
//               ObjectID: weatherGraphics.length + 1,
//               longitude: currentPoint.longitude,
//               latitude: currentPoint.latitude,
//               parameter: parameter,
//               weatherValue: weatherValue,
//               timestamp: timestamp.getTime(),
//             },
//           }),
//         );
//       }
//     }

//     console.log("g", weatherGraphics);
//     const weatherLayer = new FeatureLayer({
//       id: "weatherLayer",
//       title: "Weather visualization",
//       source: weatherGraphics,
//       objectIdField: "ObjectID",
//       geometryType: "polygon",
//       fields: fields,
//       timeInfo: {
//         startField: "timestamp",
//         endField: "timestamp",
//         interval: {
//           value: 1,
//           unit: "minutes",
//         },
//       },
//       popupTemplate: popTemplate,
//       elevationInfo: {
//         mode: "on-the-ground",
//       },
//       renderer: {
//         type: "simple",
//         symbol: {
//           type: "polygon-3d",
//           symbolLayers: [
//             {
//               type: "fill",
//               material: { color: [0, 0, 0, 0.5] }, // fallback
//             },
//           ],
//         },
//         visualVariables: weatherVariables,
//       },
//     });

//     return weatherLayer;
//   } catch (err) {
//     console.error(`Failed to fetch weather data for point ${index}`, err);
//   }
// }
