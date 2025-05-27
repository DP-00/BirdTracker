import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Multipoint from "@arcgis/core/geometry/Multipoint";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { fetchWeatherApi } from "openmeteo";
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
  {
    name: "weatherValue2",
    type: "double",
  },
  {
    name: "tileSize",
    type: "double",
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

const blankRenderer = {
  type: "simple",
  symbol: {
    type: "polygon-3d",
    symbolLayers: [
      {
        type: "fill",
        material: { color: [0, 0, 0, 0.7] },
        outline: {
          color: "white",
          size: 1,
        },
      },
    ],
  },
};

const temperatureRenderer = {
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
  visualVariables: [
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
  ],
};

// https://www.baranidesign.com/faq-articles/2020/1/19/rain-rate-intensity-classification
const precipitationRenderer = {
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
  visualVariables: [
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
  ],
};

// https://www.noaa.gov/jetstream/atmosphere/air-pressure#:~:text=Millibar%20values%20used%20in%20meteorology,pressure%20is%20almost%20always%20changing.

const pressureRenderer = {
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
  visualVariables: [
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
  ],
};

// https://www.rmets.org/metmatters/beaufort-wind-scale
const windRenderer = {
  type: "simple",
  symbol: {
    type: "polygon-3d",
    symbolLayers: [
      {
        type: "object",
        material: { color: [255, 0, 0] },
        resource: { primitive: "tetrahedron" },
        width: 800,
        depth: 1200,
        height: 15,
        anchor: "relative",
        anchorPosition: { x: 0, y: 0, z: -10 },
      },
      // {
      //   type: "icon",
      //   material: {
      //     color: [255, 0, 0],
      //   },
      //   resource: {
      //     primitive: "triangle",
      //   },
      //   size: 12,
      // },
    ],
  },
  visualVariables: [
    {
      type: "color",
      field: "weatherValue",
      stops: [
        { value: 1, color: colors[0] },
        { value: 3, color: colors[1] },
        { value: 5, color: colors[2] },
        { value: 10, color: colors[3] },
        { value: 20, color: colors[4] },
        { value: 30, color: colors[5] },
        { value: 40, color: colors[6] },
        { value: 50, color: colors[7] },
        { value: 60, color: colors[8] },
        { value: 70, color: colors[9] },
      ],
    },
    {
      type: "rotation",
      field: "weatherValue2",
      rotationType: "geographic",
      axis: "heading",
    },
    {
      type: "size",
      axis: "height",
      field: "tileSize",
      minDataValue: 1,
      maxDataValue: 100,
      minSize: 30,
      maxSize: 300,
      legendOptions: {
        showLegend: false,
      },
    },
    {
      type: "size",
      axis: "depth",
      field: "tileSize",
      minDataValue: 1,
      maxDataValue: 100,
      minSize: 600,
      maxSize: 60000,
      legendOptions: {
        showLegend: false,
      },
    },
    {
      type: "size",
      axis: "width",
      field: "tileSize",
      minDataValue: 1,
      maxDataValue: 100,
      minSize: 400,
      maxSize: 40000,
      legendOptions: {
        showLegend: false,
      },
    },
  ],
};

export async function setWeather(arcgisScene, secondaryLayer, polylineLayer) {
  const weatherSelect = document.getElementById(
    "weather-select",
  ) as HTMLCalciteSelectElement;
  const weatherSize = document.getElementById(
    "weather-size",
  ) as HTMLCalciteSelectElement;
  const weatherDistance = document.getElementById(
    "weather-distance",
  ) as HTMLCalciteSelectElement;
  const buttonWeather = document.getElementById(
    "weather-button",
  )! as HTMLCalciteButtonElement;
  let weatherLayer: FeatureLayer;
  weatherLayer = await createWeatherLayer(arcgisScene);
  buttonWeather?.addEventListener("click", async () => {
    await updateWeatherLayer(
      arcgisScene,
      secondaryLayer,
      weatherLayer,
      weatherSelect.value,
      polylineLayer,
      weatherSize.value,
      weatherDistance.value,
    );
  });
}

export async function createWeatherLayer(arcgisScene) {
  let weatherLayer = new FeatureLayer({
    id: "weatherLayer",
    title: "Weather visualization",
    source: [],
    objectIdField: "ObjectID",
    geometryType: "polygon",
    spatialReference: { wkid: 3857 },
    fields: fields,
    // timeInfo: {
    //   startField: "timestamp",
    //   endField: "timestamp",
    //   interval: {
    //     value: 1,
    //     unit: "minutes",
    //   },
    // },
    popupTemplate: {},
    elevationInfo: {
      mode: "on-the-ground",
    },
    renderer: windRenderer,
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
  tileSize,
  tileBuffer,
) {
  const buttonWeather = document.getElementById(
    "weather-button",
  )! as HTMLCalciteButtonElement;

  const weatherGraphics = [];
  let parameter;
  let weatherRenderer;
  let weatherValue;
  let popupText;
  let weatherValue2;

  switch (variable) {
    case "None": {
      const existing = await weatherLayer.queryFeatures();
      const deleteFeatures = Array.isArray(existing.features)
        ? existing.features
        : [];
      await weatherLayer.applyEdits({
        deleteFeatures,
      });
      return;
    }
    case "Blank": {
      parameter = "blank";
      weatherRenderer = blankRenderer;
      popupText = "Blank grid";
      break;
    }
    case "Temperature": {
      parameter = "temperature_2m";
      weatherRenderer = temperatureRenderer;
      popupText = "Temperature: {weatherValue}°C";

      break;
    }
    case "Pressure": {
      parameter = "surface_pressure";
      weatherRenderer = pressureRenderer;
      popupText = "Surface pressure: {weatherValue}hPa";

      break;
    }
    case "Precipitation": {
      parameter = "precipitation";
      weatherRenderer = precipitationRenderer;
      popupText = "Precipitation: {weatherValue}mm";

      break;
    }
    case "Wind 10": {
      parameter = "wind_speed_10m";
      weatherRenderer = windRenderer;
      popupText = "Wind (10 km): {weatherValue}km/h {weatherValue2}°";
      break;
    }
    case "Wind 100": {
      parameter = "wind_speed_100m";
      weatherRenderer = windRenderer;
      popupText = "Wind (100 km): {weatherValue}km/h {weatherValue2}°";
      break;
    }
  }
  buttonWeather.loading = true;

  try {
    const layerView = await arcgisScene.view.whenLayerView(layer);
    await reactiveUtils.whenOnce(() => !layerView.dataUpdating);
    const features = await layerView.queryFeatures({
      geometry: arcgisScene.view.extent,
      returnGeometry: true,
      orderByFields: ["ObjectID"],
    });

    const firstTimestamp = features.features[0].attributes.timestamp;
    console.log(features.features[0]);
    console.log(features.features[0].attributes.timestamp);
    console.log(features.features[features.features.length - 1]);
    console.log(
      features.features[features.features.length - 1].attributes.timestamp,
    );

    const lastTimestamp =
      features.features[features.features.length - 1].attributes.timestamp;

    const featureExtent = await layerView.queryExtent();
    const tiles = await generateWeatherExtent(
      featureExtent,
      arcgisScene,
      polylineLayer,
      tileSize,
      tileBuffer,
    );

    buttonWeather.innerText = `Getting weather for ${tiles.length} tiles`;

    if (tiles.length > 600) {
      buttonWeather.loading = false;
      document.getElementById("weather-alert-600").open = true;
      return;
    }

    for (const tile of tiles) {
      let timestamp = new Date(firstTimestamp);
      let timestamp2 = new Date(lastTimestamp);

      try {
        if (parameter != "Blank") {
          // USE FOR TESTING
          // weatherValue = Math.random() * 60 - 30;
          weatherValue = Math.random() * 30;
          weatherValue2 = Math.random() * 180;
          // USE FOR REAL VALUES
          // weatherValue = await getWeather(tile.centroid, timestamp, parameter);
          // if (variable === "Wind 10") {
          //   weatherValue2 = await getWeather(
          //     tile.centroid,
          //     timestamp,
          //     "wind_direction_10m",
          //   );
          // } else if (variable === "Wind 100") {
          //   weatherValue2 = await getWeather(
          //     tile.centroid,
          //     timestamp,
          //     "wind_direction_100m",
          //   );
          // }

          getWeatherAPI(tile.centroid, timestamp, timestamp2, parameter);
        }

        // console.log("tile", tile);
        if (weatherValue !== null && weatherValue !== undefined) {
          let graphic = new Graphic({
            geometry: tile,
            attributes: {
              ObjectID: weatherGraphics.length + 1,
              longitude: tile.centroid.longitude,
              latitude: tile.centroid.latitude,
              parameter: parameter,
              tileSize: tileSize,
              weatherValue: weatherValue,
              weatherValue2: weatherValue2,
              timestamp: timestamp.getTime(),
            },
          });
          weatherGraphics.push(graphic);
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

    // await weatherLayer.when();
    // await arcgisScene.view.goTo(weatherLayer.fullExtent); // go to the whole globe, no layer extent
    const result2 = await weatherLayer.queryFeatures();
    weatherLayer.renderer = weatherRenderer;

    weatherLayer.popupTemplate = {
      title: popupText,
      content:
        "<b>Date:</b> {timestamp} <br>  <b>Location:</b> {longitude}, {latitude} ",
    };
    buttonWeather.loading = false;
    buttonWeather.innerText = `Get weather`;
  } catch (error) {
    console.error("Error while updating weather layer:", error);
  }
}

export async function generateWeatherExtent(
  featureExtent,
  arcgisScene,
  polylineLayer,
  tileSize,
  tileBuffer,
) {
  console.log("e", featureExtent);

  const polygon = new Polygon({
    rings: [
      [
        featureExtent.extent.xmin - tileBuffer * 1000,
        featureExtent.extent.ymin - tileBuffer * 1000,
      ],
      [
        featureExtent.extent.xmin - tileBuffer * 1000,
        featureExtent.extent.ymax + tileBuffer * 1000,
      ],
      [
        featureExtent.extent.xmax + tileBuffer * 1000,
        featureExtent.extent.ymax + tileBuffer * 1000,
      ],
      [
        featureExtent.extent.xmax + tileBuffer * 1000,
        featureExtent.extent.ymin - tileBuffer * 1000,
      ],
      [
        featureExtent.extent.xmin - tileBuffer * 1000,
        featureExtent.extent.ymin - tileBuffer * 1000,
      ],
    ],
    spatialReference: { wkid: 3857 },
  });

  // arcgisScene.view.graphics.add(graphic);

  const tiles = await generateTiles(
    arcgisScene,
    polygon,
    polylineLayer,
    tileSize,
    tileBuffer,
  );
  // console.log(tiles);
  return tiles;
}

async function generateTiles(
  arcgisScene,
  polygon,
  polylineLayer,
  tileSize,
  tileBuffer,
) {
  // const step = 4000;
  const step = tileSize * 1000;
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

      if (distanceToLine !== null && distanceToLine <= tileBuffer) {
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
        // arcgisScene.view.graphics.add(tile);

        tiles.push(tilePolygon);
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
  console.log(point);
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

async function getWeatherAPI(point, timestampStart, timestampEnd, parameter) {
  const params = {
    latitude: point.latitude,
    longitude: point.longitude,
    start_date: timestampStart.toISOString().split("T")[0],
    end_date: timestampEnd.toISOString().split("T")[0],
    hourly: [
      "wind_direction_10m",
      "precipitation",
      "surface_pressure",
      "wind_speed_10m",
      "temperature_2m",
      "wind_direction_100m",
      "wind_speed_100m",
    ],
  };
  const url = "https://archive-api.open-meteo.com/v1/archive";
  try {
    const responses = await fetchWeatherApi(url, params);
    const response = responses[0];
    const hourly = response.hourly()!;
    const weatherData = {
      hourly: {
        time: [
          ...Array(
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
              hourly.interval(),
          ),
        ].map(
          (_, i) =>
            new Date((Number(hourly.time()) + i * hourly.interval()) * 1000),
        ),
        windDirection10m: hourly.variables(0)!.valuesArray()!,
        precipitation: hourly.variables(1)!.valuesArray()!,
        surfacePressure: hourly.variables(2)!.valuesArray()!,
        windSpeed10m: hourly.variables(3)!.valuesArray()!,
        temperature2m: hourly.variables(4)!.valuesArray()!,
        windDirection100m: hourly.variables(5)!.valuesArray()!,
        windSpeed100m: hourly.variables(6)!.valuesArray()!,
      },
    };

    console.log("weatherData", weatherData);

    // for (let i = 0; i < weatherData.hourly.time.length; i++) {
    //   console.log(
    //     weatherData.hourly.time[i].toISOString(),
    //     weatherData.hourly.windDirection10m[i],
    //     weatherData.hourly.precipitation[i],
    //     weatherData.hourly.surfacePressure[i],
    //     weatherData.hourly.windSpeed10m[i],
    //     weatherData.hourly.temperature2m[i],
    //     weatherData.hourly.windDirection100m[i],
    //     weatherData.hourly.windSpeed100m[i],
    //   );
    // }

    return weatherData;
  } catch (error) {
    // Handle HTTP and other errors
    let errorMessage = "An error occurred while fetching weather data.";

    if (error instanceof Response) {
      if (error.status === 429) {
        errorMessage = "Rate limit exceeded: Too many requests to the API.";
      } else if (error.status >= 400 && error.status < 500) {
        errorMessage = `Client error ${error.status}: Please check the request parameters.`;
      } else if (error.status >= 500) {
        errorMessage = `Server error ${error.status}: The weather service is currently unavailable.`;
      }
    } else if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }

    console.warn(errorMessage);
    // alert(errorMessage); // Optional: Use UI alert or custom warning UI
    return null;
  }
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
