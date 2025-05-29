import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Papa from "papaparse";
import {
  createCylinderLayer,
  createGeneralizedLineLayer,
  createGraphics,
  createLineLayer,
  createTimeLayer,
} from "./layers";
import { setCameraControl, setTimeSlider } from "./mapControls";
import { setSingleVis, summarizeData } from "./singleVisualization";
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
        "https://raw.githubusercontent.com/DP-00/BirdTracker/refs/heads/main/data/hbCH_cut.csv";
      const res = await fetch(defaultCSVUrl);
      csvText = await res.text();

      const mappedCols = {
        birdid: "individual-local-identifier",
        longitude: "long",
        latitude: "lat",
        altitude: "height-above-ellipsoid",
        speed: "ground-speed",
        timestamp: "timestamp",
      };

      const result = await processCSV(csvText, mappedCols, 8);
      [dataProcessed, statJSON] = result;

      [primaryLayer, generalizedLayer] = await createDefaultLayers(
        arcgisScene,
        dataProcessed,
      );
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
        [primaryLayer, generalizedLayer] = await createDefaultLayers(
          arcgisScene,
          dataProcessed,
        );

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

  return [dataProcessed, statJSON, primaryLayer, generalizedLayer];
}

async function createDefaultLayers(
  arcgisScene: HTMLArcgisSceneElement,
  dataProcessed: any,
) {
  let hourLayer, dayLayer;
  const primaryValue = "altitude";
  const secondaryValue = "speed";
  const birdPath = Object.values(dataProcessed)[0];

  const birdSummary = summarizeData(birdPath);
  const birdGraphics = createGraphics(birdPath);
  const generalizedLayer = await createGeneralizedLineLayer(dataProcessed);
  const primaryLayer = await createLineLayer(dataProcessed, birdSummary);
  const secondaryLayer = createCylinderLayer(birdGraphics, birdSummary);
  [hourLayer, dayLayer] = createTimeLayer(birdGraphics);
  const arrowLayer = new GraphicsLayer({
    title: `Extremum visualization`,
  });

  await arcgisScene.addLayers([
    primaryLayer,
    generalizedLayer,
    secondaryLayer,
    arrowLayer,
    hourLayer,
    dayLayer,
  ]);
  await primaryLayer.when();
  await arcgisScene.view.goTo(primaryLayer.fullExtent);

  await secondaryLayer.when();
  await setWeather(arcgisScene, secondaryLayer, generalizedLayer, hourLayer);

  // await arcgisScene.addLayers([weatherLayer]);
  setSingleVis(
    arcgisScene,
    primaryLayer,
    secondaryLayer,
    arrowLayer,
    birdSummary,
    primaryValue,
    secondaryValue,
  );

  setTimeSlider(arcgisScene.view, primaryLayer);
  setCameraControl(arcgisScene.view, primaryLayer);

  return [primaryLayer, generalizedLayer, secondaryLayer];
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
          const longitude = parseFloat(row[getCol("longitude")]);
          const latitude = parseFloat(row[getCol("latitude")]);
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
            // altitude: parseFloat(row[getCol("altitude")]),
            // speed: parseFloat(row[getCol("speed")]),
            altitude: parseFloat(
              parseFloat(row[getCol("altitude")]).toFixed(3),
            ),
            speed: parseFloat(parseFloat(row[getCol("speed")]).toFixed(3)),
            timestamp: new Date(row[getCol("timestamp")]),
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
