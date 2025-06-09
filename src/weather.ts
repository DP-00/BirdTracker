import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as geodeticDistanceOperator from "@arcgis/core/geometry/operators/geodeticDistanceOperator";
import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { ArcgisLegend } from "@arcgis/map-components/dist/components/arcgis-legend";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";
import { fetchWeatherApi } from "openmeteo";
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
    name: "firstTimestamp",
    type: "date",
  },
  {
    name: "lastTimestamp",
    type: "date",
  },
  {
    name: "timestamp",
    type: "date",
  },
  {
    name: "temperature",
    type: "double",
  },
  {
    name: "pressure",
    type: "double",
  },
  {
    name: "precipitation",
    type: "double",
  },
  {
    name: "windSpeed10",
    type: "double",
  },
  {
    name: "windDirection10",
    type: "double",
  },
  {
    name: "windSpeed100",
    type: "double",
  },
  {
    name: "windDirection100",
    type: "double",
  },
  {
    name: "timestampAll",
    type: "string",
  },
  {
    name: "temperatureAll",
    type: "string",
  },
  {
    name: "pressureAll",
    type: "string",
  },
  {
    name: "precipitationAll",
    type: "string",
  },
  {
    name: "windSpeed10All",
    type: "string",
  },
  {
    name: "windDirection10All",
    type: "string",
  },
  {
    name: "windSpeed100All",
    type: "string",
  },
  {
    name: "windDirection100All",
    type: "string",
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
      field: "temperature",
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
      field: "precipitation",
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
      field: "pressure",
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
      field: "windSpeed10",
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
      field: "windDirection10",
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

export async function setWeather(
  arcgisScene,
  secondaryLayer,
  polylineLayer,
  hourLayer,
) {
  const weatherSelect = document.getElementById(
    "weather-select",
  ) as HTMLCalciteSelectElement;
  const weatherSize = document.getElementById(
    "weather-size",
  ) as HTMLCalciteSliderElement;
  const weatherDistance = document.getElementById(
    "weather-distance",
  ) as HTMLCalciteSliderElement;
  const buttonWeather = document.getElementById(
    "weather-button",
  )! as HTMLCalciteButtonElement;
  const buttonTiles = document.getElementById(
    "tiles-button",
  )! as HTMLCalciteButtonElement;
  const weatherTimeSwitch = document.getElementById(
    "weather-time-switch",
  )! as HTMLCalciteSwitchElement;
  const weatherAlert = document.getElementById(
    "weather-alert-general",
  )! as HTMLCalciteAlertElement;
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  const weatherLegend = document.getElementById(
    "weather-legend",
  )! as ArcgisLegend;
  const weatherHidden = document.getElementById("weather-hidden")!;

  let weatherLayer: FeatureLayer;
  let tiles: any;

  weatherLayer = await createWeatherLayer(arcgisScene);

  weatherLegend.layerInfos = [
    {
      layer: weatherLayer,
      title: "Legend",
    },
  ];
  buttonTiles?.addEventListener("click", async () => {
    tiles = await generateWeatherExtent(
      arcgisScene,
      secondaryLayer,
      polylineLayer,
    );
    weatherHidden.style.display = "none";
  });
  buttonWeather?.addEventListener("click", async () => {
    updateWeatherLayer();
  });

  weatherSelect?.addEventListener("calciteSelectChange", async () => {
    updateWeatherRenderer();
  });

  weatherTimeSwitch?.addEventListener("calciteSwitchChange", async () => {
    const slider = document.getElementById("weather-time");
    slider.disabled = !slider.disabled;
    setWeatherLayerTime();
  });

  async function createWeatherLayer(arcgisScene) {
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
      renderer: blankRenderer,
    });

    await arcgisScene.addLayers([weatherLayer]);
    return weatherLayer;
  }

  async function generateWeatherExtent(arcgisScene, layer, polylineLayer) {
    buttonTiles.loading = true;
    try {
      const existing = await weatherLayer.queryFeatures();
      const deleteFeatures = Array.isArray(existing.features)
        ? existing.features
        : [];
      await weatherLayer.applyEdits({
        deleteFeatures,
      });

      if (weatherDistance.value == 0 || weatherSize.value == 0) {
        // buttonWeather.disabled = true;
        // weatherSelect.disabled = true;
        // weatherTimeSwitch.disabled = true;
        weatherHidden.style.display = "none";

        buttonWeather.innerText = `Get weather`;
        buttonTiles.loading = false;
        return;
      }

      const firstTimestamp = new Date(timeSlider.timeExtent.start);
      const lastTimestamp = new Date(timeSlider.timeExtent.end);

      console.log(firstTimestamp, lastTimestamp);

      if (lastTimestamp - firstTimestamp > 14 * 24 * 60 * 60 * 1000) {
        document.getElementById("weather-alert-14")!.open = true;
        buttonTiles.loading = false;
        return;
      }
      const layerView = await arcgisScene.view.whenLayerView(layer);
      await reactiveUtils.whenOnce(() => !layerView.dataUpdating);
      const featureExtent = await layerView.queryExtent();

      const polygon = new Polygon({
        rings: [
          [
            featureExtent.extent.xmin - weatherDistance.value * 1000,
            featureExtent.extent.ymin - weatherDistance.value * 1000,
          ],
          [
            featureExtent.extent.xmin - weatherDistance.value * 1000,
            featureExtent.extent.ymax + weatherDistance.value * 1000,
          ],
          [
            featureExtent.extent.xmax + weatherDistance.value * 1000,
            featureExtent.extent.ymax + weatherDistance.value * 1000,
          ],
          [
            featureExtent.extent.xmax + weatherDistance.value * 1000,
            featureExtent.extent.ymin - weatherDistance.value * 1000,
          ],
          [
            featureExtent.extent.xmin - weatherDistance.value * 1000,
            featureExtent.extent.ymin - weatherDistance.value * 1000,
          ],
        ],
        spatialReference: { wkid: 3857 },
      });

      const tiles = await generateTiles(
        polygon,
        polylineLayer,
        firstTimestamp,
        lastTimestamp,
      );

      await weatherLayer.applyEdits({
        addFeatures: tiles,
      });
      updateWeatherRenderer("Blank");
      buttonWeather.innerText = `Get weather for ${tiles.length} tiles`;
      buttonTiles.loading = false;
      if (tiles.length > 600) {
        document.getElementById("weather-alert-600")!.open = true;
        buttonWeather.disabled = true;
        return;
      } else {
        buttonWeather.disabled = false;
        await arcgisScene.view.goTo(tiles);
      }

      return tiles;
    } catch (error) {
      buttonWeather.disabled = true;
      buttonWeather.innerText = `Get weather`;
      console.error("Error while generating weather tiles:", error);
    }
  }

  async function generateTiles(
    polygon,
    polylineLayer,
    firstTimestamp,
    lastTimestamp,
  ) {
    const step = weatherSize.value * 1000;
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
    const tiles = [];
    for (let x = xmin; x < xmax; x += step) {
      for (let y = ymin; y < ymax; y += step) {
        const tileCenter = new Point({
          x: x + step / 2,
          y: y + step / 2,
          spatialReference: polygon.spatialReference,
        });

        if (!geodeticDistanceOperator.isLoaded()) {
          await geodeticDistanceOperator.load();
        }

        let distanceToLine = geodeticDistanceOperator.execute(
          tileCenter,
          polyline,
        );

        if (
          distanceToLine !== null &&
          distanceToLine / 1000 <= weatherDistance.value
        ) {
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

          let tile = new Graphic({
            geometry: tilePolygon,
            attributes: {
              ObjectID: tiles.length + 1,
              longitude: tilePolygon.centroid?.longitude,
              latitude: tilePolygon.centroid?.latitude,
              timestamp: lastTimestamp.getTime(),
              firstTimestamp: firstTimestamp.getTime(),
              lastTimestamp: lastTimestamp.getTime(),
              tileSize: weatherSize.value,
            },
          });

          console.log("gr", tile);

          tiles.push(tile);
        }
      }
    }

    return tiles;
  }

  async function getWeatherAPI(point, timestampStart, timestampEnd) {
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
      const round1 = (v: number) => Math.round(v * 10) / 10;
      const toRoundedArray = (typedArray: Float32Array | number[]) =>
        Array.from(typedArray, round1);
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

          windDirection10m: toRoundedArray(hourly.variables(0)!.valuesArray()!),
          precipitation: toRoundedArray(hourly.variables(1)!.valuesArray()!),
          surfacePressure: toRoundedArray(hourly.variables(2)!.valuesArray()!),
          windSpeed10m: toRoundedArray(hourly.variables(3)!.valuesArray()!),
          temperature2m: toRoundedArray(hourly.variables(4)!.valuesArray()!),
          windDirection100m: toRoundedArray(
            hourly.variables(5)!.valuesArray()!,
          ),
          windSpeed100m: toRoundedArray(hourly.variables(6)!.valuesArray()!),
        },
      };

      console.log("weatherData", weatherData);

      return weatherData.hourly;
    } catch (error) {
      let errorMessage = "An error occurred while fetching weather data.";

      if (error instanceof Response) {
        errorMessage = `Error ${error.status}`;
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }

      const messageSlot = weatherAlert?.querySelector('[slot="message"]');
      if (messageSlot) {
        messageSlot.textContent = errorMessage;
      }
      weatherAlert.open = true;
      // console.warn(errorMessage);
      return null;
    }
  }

  async function updateWeatherLayer() {
    buttonWeather.loading = true;

    let isUpdated = false;

    if (tiles == undefined || tiles.length === 0) {
      buttonWeather.loading = false;
      buttonWeather.innerText = `Get weather`;
      return;
    }
    for (const tile of tiles) {
      const weatherData = await getWeatherAPI(
        tile.geometry.centroid,
        new Date(tile.attributes.firstTimestamp),
        new Date(tile.attributes.lastTimestamp),
      );

      if (weatherData) {
        tile.attributes.timestampAll = weatherData.time;
        tile.attributes.temperatureAll = weatherData.temperature2m;
        tile.attributes.precipitationAll = weatherData.precipitation;
        tile.attributes.pressureAll = weatherData.surfacePressure;
        tile.attributes.windSpeed10All = weatherData.windSpeed10m;
        tile.attributes.windDirection10All = weatherData.windDirection10m;
        tile.attributes.windSpeed100All = weatherData.windSpeed100m;
        tile.attributes.windDirection100All = weatherData.windDirection100m;
        isUpdated = true;
      } else {
        await weatherLayer.applyEdits({
          deleteFeatures: tiles,
        });
        buttonWeather.loading = false;
        return;
      }
    }
    if (isUpdated) {
      createTimeControl();

      // weatherSelect.disabled = false;
      // weatherTimeSwitch.disabled = false;
      weatherHidden.style.display = "grid";

      await setWeatherLayerTime();
      updateWeatherRenderer();
    }

    await weatherLayer.applyEdits({
      updateFeatures: tiles,
    });

    buttonWeather.loading = false;
  }

  function createTimeControl() {
    const weatherTimeContainer = document.getElementById(
      "weather-time-container",
    ) as HTMLElement;

    let timeArray = tiles[0].attributes.timestampAll;
    weatherTimeContainer.innerHTML = "";
    const slider = document.createElement("calcite-slider");

    slider.id = "weather-time";
    slider.min = 0;
    slider.max = timeArray.length - 1;
    slider.value = timeArray.length - 1;
    slider.style = "width:250px";
    slider.setAttribute("label-handles", "");
    slider.labelFormatter = function (value, type) {
      if (type === "value") {
        return formatDateShort(timeArray[value]);
      }
    };
    slider.addEventListener("calciteSliderInput", async () => {
      await setWeatherLayerTime();
    });
    slider.disabled = true;
    weatherTimeContainer.appendChild(slider);

    timeSlider.addEventListener("arcgisPropertyChange", (event) => {
      slider.value = mapDatetoIndex(timeSlider.timeExtent.end, timeArray);
      setWeatherLayerTime();
    });
  }

  async function setWeatherLayerTime() {
    let timeIndex = document.getElementById("weather-time")!.value;

    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i];

      if (!weatherTimeSwitch.checked) {
        let currentTimestamp = await getClosestHour(tile.geometry.centroid);
        timeIndex = mapDatetoIndex(
          currentTimestamp,
          tile.attributes.timestampAll,
        );
      }

      if (
        tile.attributes.timestampAll &&
        tile.attributes.timestampAll[timeIndex] !== undefined
      ) {
        tile.attributes.timestamp =
          tile.attributes.timestampAll[timeIndex].toISOString();
        tile.attributes.temperature = tile.attributes.temperatureAll[timeIndex];
        tile.attributes.precipitation =
          tile.attributes.precipitationAll[timeIndex];
        tile.attributes.pressure = tile.attributes.pressureAll[timeIndex];
        tile.attributes.windSpeed10 = tile.attributes.windSpeed10All[timeIndex];
        tile.attributes.windDirection10 =
          tile.attributes.windDirection10All[timeIndex];
        tile.attributes.windSpeed100 =
          tile.attributes.windSpeed100All[timeIndex];
        tile.attributes.windDirection100 =
          tile.attributes.windDirection100All[timeIndex];
      }
      // else {
      //   // Remove tile if no timestamp data (backward for loop to allow it)
      //   tiles.splice(i, 1);
      // }
    }
    await weatherLayer.applyEdits({
      updateFeatures: tiles,
    });
  }

  function updateWeatherRenderer(value = weatherSelect.value) {
    let weatherRenderer;
    let popupText;
    switch (value) {
      case "Blank": {
        weatherRenderer = blankRenderer;
        popupText = "Grid layout";
        break;
      }
      case "Temperature": {
        weatherRenderer = temperatureRenderer;
        popupText = "Temperature: {temperature} °C";
        break;
      }
      case "Pressure": {
        weatherRenderer = pressureRenderer;
        popupText = "Surface pressure: {pressure} hPa";
        break;
      }
      case "Precipitation": {
        weatherRenderer = precipitationRenderer;
        popupText = "Precipitation: {precipitation} mm";
        break;
      }
      case "Wind": {
        weatherRenderer = windRenderer;
        popupText = "Wind: {windSpeed10} km/h   {windDirection10} °";
        break;
      }
    }

    weatherLayer.renderer = weatherRenderer;

    const fieldInfos = [
      "temperature",
      "pressure",
      "precipitation",
      "windSpeed10",
      "windDirection10",
      "windSpeed100",
      "windDirection100",
    ].map((f) => ({ fieldName: f }));

    weatherLayer.popupTemplate = {
      title: popupText,
      outFields: ["*"],
      content: [
        {
          type: "custom",
          creator: createWeatherChartPopup(value),
        },
        {
          type: "text",
          text: "<b>Date:</b> {timestamp} <br><b>Location:</b>{longitude}, {latitude} <br><br> <b>All weather parameters at this time and place:</b>",
        },

        {
          type: "fields",
          fieldInfos,
        },
      ],
    };
  }

  // src: chatGPT based on the given requirements

  function createWeatherChartPopup(variableName) {
    return (target) => {
      const graphic = target.graphic;
      const attrs = graphic.attributes;

      // --- Parse timestamps ---
      const timestampStrings = String(attrs.timestampAll)
        .split(",")
        .map((s) => s.trim());
      const timestamps = timestampStrings.map((s) => new Date(s));

      // --- Extract data based on selected variable ---
      let rawValues = [];
      let label = "";
      let color = "rgb(255, 99, 132)";

      switch (variableName) {
        case "Temperature":
          rawValues = String(attrs.temperatureAll)
            .split(",")
            .map((v) => parseFloat(v.trim()));
          label = "Temperature (°C)";
          break;
        case "Pressure":
          rawValues = String(attrs.pressureAll)
            .split(",")
            .map((v) => parseFloat(v.trim()));
          label = "Pressure (hPa)";
          break;
        case "Precipitation":
          rawValues = String(attrs.precipitationAll)
            .split(",")
            .map((v) => parseFloat(v.trim()));
          label = "Precipitation (mm)";
          break;
        case "Wind":
          rawValues = String(attrs.windSpeed10All)
            .split(",")
            .map((v) => parseFloat(v.trim()));
          label = "Wind Speed 10m (km/h)";
          break;
      }

      // --- Generate readable labels for x-axis ---
      const labels = timestamps.map((d, i) => {
        const hour = d.getHours();
        const minute = d.getMinutes();

        const isMidnight = hour === 0 && minute === 0;
        const isNoon = hour === 12 && minute === 0;

        if (isMidnight) return `${d.getDate()}/${d.getMonth() + 1}`;
        if (isNoon) return "12h";

        return ""; // hide all other labels
      });

      // --- Create chart container ---
      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.maxWidth = "350px";
      container.style.height = "160px";

      const canvas = document.createElement("canvas");
      canvas.width = 350;
      canvas.height = 160;
      container.appendChild(canvas);

      const nowLinePlugin = {
        id: "nowLine",
        afterDraw(chart) {
          const {
            ctx,
            chartArea: { top, bottom },
            scales: { x },
          } = chart;

          // Find the index of the current/nearest timestamp
          const now = new Date(attrs.timestamp);
          const index = timestamps.findIndex(
            (t) => Math.abs(t.getTime() - now.getTime()) < 60 * 60 * 1000, // within 1h
          );

          if (index === -1) return;

          const xPos = x.getPixelForValue(index);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xPos, top);
          ctx.lineTo(xPos, bottom);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "white";
          ctx.setLineDash([4, 2]);
          ctx.stroke();

          // Draw "Now" label
          ctx.fillStyle = "white";
          ctx.font = "10px sans-serif";
          ctx.fillText("Now", xPos + 4, top + 10);
          ctx.restore();
        },
      };

      // --- Create chart after DOM is ready ---
      setTimeout(() => {
        const ctx = canvas.getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label,
                data: rawValues,
                fill: false,
                borderColor: color,
                tension: 0.2,
                pointRadius: 0,
              },
            ],
          },
          options: {
            responsive: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (tooltipItems) => {
                    const i = tooltipItems[0].dataIndex;
                    return timestamps[i].toLocaleString();
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  font: { size: 10 },
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 0,
                  callback: function (val, index, ticks) {
                    return labels[index]; // Use custom formatted labels
                  },
                },
              },
              y: {
                title: {
                  display: true,
                  text: label,
                },
              },
            },
          },
          plugins: [nowLinePlugin],
        });
      }, 0);

      return container;
    };
  }

  async function getClosestHour(weatherPoint) {
    let closestGraphic = null;
    let minDistance = Infinity;

    for (const graphic of hourLayer.graphics.items) {
      let graphicPoint = new Point({
        longitude: graphic.geometry.longitude,
        latitude: graphic.geometry.latitude,
        spatialReference: graphic.geometry.spatialReference,
      });

      let graphicPointMercator =
        webMercatorUtils.geographicToWebMercator(graphicPoint);

      if (!geodeticDistanceOperator.isLoaded()) {
        await geodeticDistanceOperator.load();
      }

      let distance = geodeticDistanceOperator.execute(
        graphicPointMercator,
        weatherPoint,
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestGraphic = graphic;
      }
    }

    if (closestGraphic) {
      return new Date(closestGraphic.attributes.timestamp);
    }

    return null;
  }

  function mapDatetoIndex(date, timeArray) {
    const targetHour = new Date(date);
    targetHour.setMinutes(0, 0, 0);

    for (let i = 0; i < timeArray.length; i++) {
      const arrayDate = new Date(timeArray[i]);
      arrayDate.setMinutes(0, 0, 0);
      if (arrayDate.getTime() === targetHour.getTime()) {
        return i;
      }
    }

    return 0;
  }

  function formatDateShort(d) {
    return `${d.getHours()}h ${d.getDate()}/${d.getMonth() + 1}`;
  }
}
