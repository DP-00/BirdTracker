import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export async function setWeather(graphics, arcgisScene, weatherLayer) {
  const weatherSelect = document.getElementById(
    "weather-select",
  ) as HTMLCalciteSelectElement;

  weatherSelect?.addEventListener("calciteSelectChange", async () => {
    updateWeatherLayer(weatherLayer, weatherSelect.value);
  });
}

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

export async function updateWeaterLayer(layer, variable) {
  let parameter;
  let weatherVariables;
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
}

export async function createWeatherLayer(graphics, variable) {
  let interval = 60 * 60 * 1000;
  let minScale = 300000;
  let lastTimestamp = null;
  let firstTimestamp = null;
  let lastPoint = null;
  let accumulatedDistance = 0;
  const weatherGraphics = [];
  let parameter = "temperature_2m";
  let weatherVariables = temperatureVariables;

  try {
    for (const g of graphics) {
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

      //   if (!lastTimestamp || currentTimestamp - lastTimestamp >= interval) {
      if (!lastTimestamp || distanceFromLast >= 4) {
        accumulatedDistance += distanceFromLast;
        lastTimestamp = currentTimestamp;
        lastPoint = currentPoint;
        const timestamp = new Date(currentTimestamp);
        // const temp = Math.random() * 60 - 30;
        let weatherValue = await getWeather(currentPoint, timestamp, parameter);
        // console.log("w", weatherValue);
        const square = createSquareAroundPoint(currentPoint);
        weatherGraphics.push(
          new Graphic({
            geometry: square,
            attributes: {
              ObjectID: weatherGraphics.length + 1,
              longitude: currentPoint.longitude,
              latitude: currentPoint.latitude,
              parameter: parameter,
              weatherValue: weatherValue,
              timestamp: timestamp.getTime(),
            },
          }),
        );
      }
    }

    console.log("g", weatherGraphics);
    const weatherLayer = new FeatureLayer({
      id: "weatherLayer",
      title: "Weather visualization",
      source: weatherGraphics,
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
              material: { color: [0, 0, 0, 0.5] }, // fallback
            },
          ],
        },
        visualVariables: weatherVariables,
      },
    });

    return weatherLayer;
  } catch (err) {
    console.error(`Failed to fetch weather data for point ${index}`, err);
  }
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
  const temp = index >= 0 ? temps[index] : "n/a";

  return temp;
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
