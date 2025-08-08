import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import Papa from "papaparse";
import { setCharts } from "./charts";
import {
  createCylinderLayer,
  createGeneralizedLineLayer,
  createGraphics,
  createGroupLineLayer,
  createIconLayer,
  createLineLayer,
  createTimeMarkersLayer,
} from "./layers";
import { setSingleVis, summarizeData } from "./singleVisualization";
import { setTimeSlider } from "./timeSlider";

import TimeExtent from "@arcgis/core/time/TimeExtent";
import { formatDate, removeLayersByTitles } from "./utils";
import { setWeather } from "./weather";

export async function loadData(arcgisScene: HTMLArcgisSceneElement) {
  const csvInput = document.getElementById("csv-input")! as HTMLInputElement;
  const columnPanel = document.getElementById("column-assignment")!;
  const buttonSave = document.getElementById(
    "save-button",
  )! as HTMLCalciteButtonElement;
  const buttonSample = document.getElementById(
    "sample-button",
  )! as HTMLCalciteButtonElement;
  const dialog = document.getElementById(
    "loading-dialog",
  )! as HTMLCalciteDialogElement;
  const alert = document.getElementById(
    "loading-error",
  )! as HTMLCalciteAlertElement;

  let columnNames = {
    birdid: document.getElementById("id-select"),
    longitude: document.getElementById("lon-select"),
    latitude: document.getElementById("lat-select"),
    altitude: document.getElementById("elev-select"),
    speed: document.getElementById("speed-select"),
    timestamp: document.getElementById("timestamp-select"),
  };

  const defaultNames = {
    birdid: ["individual-local-identifier", "individual_local_identifier"],
    longitude: ["long", "longitude", "lon", "location_long", "location-long"],
    latitude: ["lat", "latitude", "location_lat", "location-lat"],
    altitude: [
      "height-above-ellipsoid",
      "height_above_ellipsoid",
      "altitude",
      "elevation",
      "elev",
    ],
    speed: ["ground-speed", "ground_speed", "ground.speed", "speed"],
    timestamp: ["timestamp", "time", "datetime"],
  };

  let file: any;
  let csvText: string;
  let headers;
  let dataProcessed;
  let statJSON = {};
  let primaryLayer;
  let generalizedLayer;

  csvInput?.addEventListener("change", async (event) => {
    try {
      file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        columnPanel.hidden = true;
        dialog.loading = false;
        buttonSave.disabled = true;

        return;
      }
      buttonSave.disabled = false;
      dialog.loading = true;
      columnPanel.hidden = false;
      csvText = await file.text();
      headers = csvText
        .split(/\r?\n/)[0]
        .split(",")
        .map((h: string) => h.trim().replace(/^"(.*)"$/, "$1"));
      createColumnSelects(headers, columnNames, defaultNames);
    } catch (err) {
      console.error(err);
      alert.open = true;
      columnPanel.hidden = true;
    } finally {
      dialog.loading = false;
    }
  });

  buttonSample?.addEventListener("click", async () => {
    try {
      dialog.loading = true;

      const defaultCSVUrl =
        "https://raw.githubusercontent.com/DP-00/BirdTracker/refs/heads/main/data/hbUsabilityStudy.csv";
      const res = await fetch(defaultCSVUrl);
      csvText = await res.text();

      const mappedCols = {
        birdid: "individual_local_identifier",
        longitude: "location_long",
        latitude: "location_lat",
        altitude: "height_above_ellipsoid",
        speed: "ground_speed",
        timestamp: "timestamp",
      };

      const result = await processCSV(csvText, mappedCols, 8);
      [dataProcessed, statJSON] = result;

      await createGroupVisView(arcgisScene, dataProcessed);
      console.log("Parsed CSV Data:", dataProcessed);
    } catch (err) {
      console.error(err);
    } finally {
      dialog.loading = false;
      dialog.open = false;
    }
  });

  buttonSave?.addEventListener("click", async () => {
    try {
      let startTime = performance.now(); // for loading time
      let fileSize = file.size / (1024 * 1024);
      dialog.loading = true;
      const mappedCols = Object.fromEntries(
        Object.entries(columnNames).map(([key, el]) => [
          key,
          (el as HTMLSelectElement).value,
        ]),
      );
      const result = await processCSV(csvText, mappedCols, fileSize);
      [dataProcessed, statJSON] = result;

      if (Object.keys(dataProcessed).length === 0) {
        alert.open = true;
      } else {
        await createGroupVisView(arcgisScene, dataProcessed);

        console.log("Parsed CSV Data:", dataProcessed);
        console.log(
          `Data: ${Object.keys(dataProcessed).length} tracks, ${csvText.length} points, ${fileSize.toFixed(0)} MB, ${((performance.now() - startTime!) / 1000).toFixed(2)} s`,
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      dialog.loading = false;
      dialog.open = false;
    }
  });
}

async function createGroupVisView(
  arcgisScene: HTMLArcgisSceneElement,
  dataProcessed: any,
) {
  const generalizedLayer = await createGeneralizedLineLayer(
    dataProcessed,
    arcgisScene,
  );
  const groupLineLayer = await createGroupLineLayer(dataProcessed);
  const iconLayer = await createIconLayer(dataProcessed);
  arcgisScene.map?.addMany([generalizedLayer, groupLineLayer, iconLayer]);

  let birdIds = Object.keys(dataProcessed);
  document.getElementById("nr-of-paths")!.innerText = birdIds.length;
  await createBirdList(birdIds, generalizedLayer, arcgisScene);

  const { features } = await generalizedLayer.queryFeatures({
    where: "1=1",
    outFields: ["startDate", "endDate"],
    returnGeometry: false,
  });

  const timeExtent = new TimeExtent({
    start: new Date(Math.min(...features.map((f) => f.attributes.startDate))),
    end: new Date(Math.max(...features.map((f) => f.attributes.endDate))),
  });

  await setTimeSlider(arcgisScene, timeExtent, dataProcessed, []);

  arcgisScene.view.goTo({
    target: generalizedLayer.fullExtent,
    heading: 0,
    tilt: 0,
  });
  document.getElementById("zoom-group")!.addEventListener("click", async () => {
    arcgisScene.view.goTo({
      target: generalizedLayer.fullExtent,
      heading: 0,
      tilt: 0,
    });
  });

  document.body.classList.toggle("bird-mode", true);
  const startDatePickerSection = document.getElementById("date-picker-start")!;
  const homeBtn = document.getElementById("show-group-vis")!;
  homeBtn.addEventListener("click", async () => {
    homeBtn.loading = true;
    document.getElementById("dashboard-single-vis").loading = true;
    document.getElementById("dashboard-single-vis")!.style.display = "none";
    removeLayersByTitles(arcgisScene.view, [
      "Line visualization",
      "Cylinder visualization",
      "Time and distance visualization",
      "Extremum visualization",
    ]);
    await setTimeSlider(arcgisScene, timeExtent, dataProcessed, []);
    document.getElementById("time-zoom")!.style.display = "none";
    document.getElementById("time-duration")!.style.display = "none";
    document.getElementById("time-distance")!.style.display = "none";
    document.body.classList.toggle("bird-mode", true);

    startDatePickerSection.style.display = "none";

    groupLineLayer.visible = true;
    await arcgisScene.view.goTo({
      target: generalizedLayer.fullExtent,
      heading: 0,
      tilt: 0,
    });
    homeBtn.loading = false;
    document.getElementById("dashboard-single-vis").loading = false;

    document.getElementById("dashboard-group-vis")!.style.display = "block";
  });
}

export async function createSingleVisView(
  arcgisScene: HTMLArcgisSceneElement,
  dataProcessed: any,
  birdid: string,
) {
  document.getElementById("details-button")!.loading = true;
  document.getElementById("dashboard")!.loading = true;
  document.getElementById("dashboard-group-vis")!.style.display = "none";
  document.getElementById("dashboard-single-vis")!.style.display = "block";
  const groupLineLayer = arcgisScene.view.map.allLayers.find(
    (layer) => layer.title === "Group visualization",
  );
  groupLineLayer.visible = false;

  removeLayersByTitles(arcgisScene.view, [
    "Line visualization",
    "Cylinder visualization",
    "Time and distance visualization",
    "Extremum visualization",
  ]);

  const primaryValue = "altitude";
  const secondaryValue = "speed";

  const birdPath = dataProcessed[birdid];
  const birdSummary = summarizeData(birdPath);
  const birdGraphics = createGraphics(birdPath);
  const polyline = await createPolyline(birdPath);
  const primaryLayer = await createLineLayer(birdPath, birdSummary);
  const secondaryLayer = createCylinderLayer(birdGraphics, birdSummary);
  const dayLayer = await createTimeMarkersLayer(birdGraphics);
  const arrowLayer = new GraphicsLayer({
    title: `Extremum visualization`,
  });

  arcgisScene.map?.addMany([
    primaryLayer,
    secondaryLayer,
    arrowLayer,
    dayLayer,
  ]);
  await primaryLayer.when();
  // await arcgisScene.view.goTo(primaryLayer.fullExtent);
  await arcgisScene.view.goTo({
    target: primaryLayer.fullExtent,
    heading: 0,
    tilt: 0,
  });
  await secondaryLayer.when();

  await setSingleVis(
    arcgisScene,
    primaryLayer,
    secondaryLayer,
    arrowLayer,
    dayLayer,
    birdSummary,
    primaryValue,
    secondaryValue,
    birdPath,
    polyline,
  );
  await setTimeSlider(
    arcgisScene,
    primaryLayer.timeInfo?.fullTimeExtent,
    dataProcessed,
    birdGraphics,
  );
  await setWeather(arcgisScene, secondaryLayer, birdid);
  await setCharts(polyline, secondaryLayer, arcgisScene, birdSummary);
  document.getElementById("gauges-container")!.style.display = "none";
  document.getElementById("animation-playrate")!.style.display = "none";
  document.getElementById("play-group-animation")!.style.display = "none";
  document.getElementById("date-picker-start")!.style.display = "block";
  document.getElementById("time-zoom")!.style.display = "block";
  document.getElementById("time-duration")!.style.display = "block";
  document.getElementById("time-distance")!.style.display = "block";

  document.body.classList.toggle("bird-mode", false);
  document.getElementById("camera-control")!.value = "line";
  document.getElementById("dashboard")!.loading = false;
  document.getElementById("details-button")!.loading = false;
}

async function createPolyline(birdData) {
  const polyline = new Polyline({
    spatialReference: { wkid: 4326 },
    paths: birdData.map(
      (pt: { longitude: any; latitude: any; altitude: any }) => [
        pt.longitude,
        pt.latitude,
        pt.altitude,
      ],
    ),
  });
  const lineGraphic = new Graphic({ geometry: polyline });
  return lineGraphic;
}

async function createBirdList(birdIds: string[], featureLayer, arcgisScene) {
  const list = document.getElementById("bird-list") as HTMLCalciteListElement;
  list.innerHTML = "";
  let view = arcgisScene.view;
  for (let birdId of birdIds) {
    const features = await featureLayer.queryFeatures({
      where: `birdid = '${birdId}'`,
      returnGeometry: true,
      outFields: ["*"],
    });
    const feature = features.features[0];
    if (feature) {
      const { length, startDate, endDate, color } = feature.attributes;
      const listItem = document.createElement("calcite-list-item");
      listItem.setAttribute("label", `BIRD ${birdId}`);
      listItem.setAttribute("value", birdId);
      const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

      const durationMs = endDate - startDate;
      const durationHrs = Math.floor(durationMs / (1000 * 60 * 60));
      const days = Math.floor(durationHrs / 24);
      const hours = durationHrs % 24;
      const description = `${days} d ${hours} h |  ${dateRange}   |   ${length} km `;
      listItem.setAttribute("description", description);
      listItem.setAttribute("icon-end", "layer-zoom-to");
      let activeHighlight = null;

      listItem.addEventListener("pointerenter", async () => {
        if (activeHighlight) {
          activeHighlight.remove();
          activeHighlight = null;
        }

        const layerView = await arcgisScene.view.whenLayerView(featureLayer);
        activeHighlight = layerView.highlight(feature);
      });

      listItem.addEventListener("pointerleave", () => {
        if (activeHighlight) {
          activeHighlight.remove();
          activeHighlight = null;
        }
      });
      listItem.addEventListener("click", async () => {
        await arcgisScene.view.goTo({
          target: feature.geometry,
          heading: 0,
          tilt: 0,
        });
        const layerView = await arcgisScene.view.whenLayerView(featureLayer);
        let highlight = layerView.highlight(feature);
        setTimeout(() => {
          highlight.remove();
        }, 3000);
        view.openPopup({
          features: [feature],
        });
      });
      listItem.style.setProperty("--calcite-list-label-text-color", color);
      list.appendChild(listItem);
    }
  }
}

function createColumnSelects(
  headers: string[],
  columnElements: any,
  defaultNames: any,
) {
  for (const [key, select] of Object.entries(columnElements)) {
    select.innerHTML = "";

    headers.forEach((header) => {
      const option = document.createElement("calcite-option");
      option.value = option.label = option.textContent = header;
      select.appendChild(option);
    });

    select.value = "";
    const match = defaultNames[key]?.find((defaultKey: string) =>
      headers.some((h) => h.toLowerCase() === defaultKey.toLowerCase()),
    );
    if (match) select.value = match;
  }
}

//src: chatGPT based on given requirements
function processCSV(
  csvText: string,
  columnNames: {
    [x: string]: any;
    birdid?: string;
    longitude?: string;
    latitude?: string;
    altitude?: string;
    speed?: string;
    timestamp?: string;
  },
  fileSize: number,
) {
  return new Promise((resolve) => {
    const getCol = (key: string) => {
      const col = columnNames[key];
      return typeof col === "string" ? col : col?.value;
    };

    const useWorker = fileSize < 250; // Use worker if < 250 MB
    Papa.parse(csvText, {
      header: true,
      worker: useWorker,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: ({ data, meta: { fields: headers } }) => {
        const excludeKeys = [
          "birdid",
          "longitude",
          "latitude",
          "altitude",
          "speed",
          "timestamp",
        ].map(getCol);
        const groupedByBird: Record<string, any[]> = {};
        const statJSON: Record<string, any> = {};

        for (const row of data) {
          const birdid = row[getCol("birdid")] ?? "unknown";
          const longitude = parseFloat(
            parseFloat(row[getCol("longitude")]).toFixed(6),
          );
          const latitude = parseFloat(
            parseFloat(row[getCol("latitude")]).toFixed(6),
          );
          if (
            isNaN(longitude) ||
            isNaN(latitude) ||
            (longitude === 0 && latitude === 0)
          )
            continue;

          const dataPoint = {
            birdid,
            longitude,
            latitude,
            altitude: parseFloat(
              parseFloat(row[getCol("altitude")]).toFixed(3),
            ),
            speed: parseFloat(parseFloat(row[getCol("speed")]).toFixed(3)),
            timestamp: new Date(row[getCol("timestamp")] + "Z"), // show that UTC
            ...Object.fromEntries(
              headers
                .filter((h: any) => !excludeKeys.includes(h))
                .map((h: string | number) => {
                  const value = row[h];
                  const processedValue =
                    typeof value === "number"
                      ? parseFloat(value.toFixed(3))
                      : !isNaN(parseFloat(value)) && isFinite(value)
                        ? parseFloat(parseFloat(value).toFixed(3))
                        : value;
                  return [h, processedValue];
                }),
            ),
            // ...Object.fromEntries(
            //   headers
            //     .filter((h: any) => !excludeKeys.includes(h))
            //     .map((h: string | number) => [h, row[h]]),
            // ),
          };

          (groupedByBird[birdid] ||= []).push(dataPoint);
          statJSON[birdid] ||= {};

          for (const [key, val] of Object.entries(dataPoint)) {
            if (
              !excludeKeys.includes(key) &&
              typeof val === "number" &&
              !isNaN(val)
            ) {
              const stats = (statJSON[birdid][key] ||= {
                min: val,
                max: val,
                sum: 0,
                count: 0,
              });
              stats.min = Math.min(stats.min, val);
              stats.max = Math.max(stats.max, val);
              stats.sum += val;
              stats.count += 1;
            }
          }
        }

        for (const birdid in statJSON) {
          for (const field in statJSON[birdid]) {
            const s = statJSON[birdid][field];
            statJSON[birdid][field] = {
              min: +s.min.toFixed(2),
              max: +s.max.toFixed(2),
              mean: +(s.sum / s.count).toFixed(2),
            };
          }
        }

        resolve([groupedByBird, statJSON]);
      },
    });
  });
}
