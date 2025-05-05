import {
  createGeneralizedLineLayer,
  createLineLayer,
  processCSV,
} from "../utils";

import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import { ArcgisSceneCustomEvent } from "@arcgis/map-components";
import "@arcgis/map-components/dist/components/arcgis-area-measurement-3d";
import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-compass";
import "@arcgis/map-components/dist/components/arcgis-daylight";
import "@arcgis/map-components/dist/components/arcgis-directline-measurement-3d";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-fullscreen";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-navigation-toggle";
import "@arcgis/map-components/dist/components/arcgis-placement";
import "@arcgis/map-components/dist/components/arcgis-scene";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-time-slider";
import "@arcgis/map-components/dist/components/arcgis-zoom";

import AppStore from "../stores/AppStore";
import { Widget } from "./Widget";

import "@arcgis/core/geometry/operators/generalizeOperator";
import TimeExtent from "@arcgis/core/time/TimeExtent";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-action-group";
import "@esri/calcite-components/dist/components/calcite-action-pad";
import "@esri/calcite-components/dist/components/calcite-alert";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-dialog";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-loader";
import "@esri/calcite-components/dist/components/calcite-menu";
import "@esri/calcite-components/dist/components/calcite-menu-item";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-navigation-user";
import "@esri/calcite-components/dist/components/calcite-notice";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-tabs";

type AppProperties = {};

const params = new URLSearchParams(document.location.search.slice(1));

@subclass()
class App extends Widget<AppProperties> {
  @property({ constructOnly: true })
  store = new AppStore();

  @property()
  webSceneId = params.get("webscene") || "91b46c2b162c48dba264b2190e1dbcff";

  private bindView(arcgisScene: HTMLArcgisSceneElement) {
    const view = arcgisScene.view;
    // this.store.sceneStore.view = view;
    view.when().then(() => {
      // initView(view)
      console.log("Widget initialized, DOM is ready!");

      const arcgisMap = document.querySelector(
        "arcgis-scene",
      ) as HTMLArcgisSceneElement;
      const timeSlider = document.querySelector("arcgis-time-slider");
      const csvInput = document.getElementById("csv-input")!;
      const columnPanel = document.getElementById("column-assignment")!;
      const buttonSave = document.getElementById(
        "save-button",
      ) as HTMLCalciteButtonElement;
      const dialog = document.getElementById(
        "loading-dialog",
      ) as HTMLCalciteDialogElement;
      const alert = document.getElementById("loading-error")!;

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
        longitude: [
          "long",
          "longitude",
          "lon",
          "location_long",
          "location-long",
        ],
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

      let fileSize: string | number;
      let dataParsed: string | any[];
      let headers;
      let dataProcessed;
      let statJSON = {};

      csvInput?.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        fileSize = (file.size / (1024 * 1024)).toFixed(0);
        if (!file) {
          columnPanel.hidden = true;
          dialog.loading = false;
          return;
        }
        dialog.loading = true;
        columnPanel.hidden = false;

        try {
          const text = await file.text();
          dataParsed = text
            .split(/\r?\n/)
            .filter((row: string) => row.trim() !== "");
          headers = dataParsed[0]
            .split(",")
            .map((h) => h.trim().replace(/^"(.*)"$/, "$1"));

          for (const [key, select] of Object.entries(columnNames)) {
            if (!(select instanceof HTMLElement)) continue;
            select.innerHTML = ""; // Clear any existing options
            headers.forEach((header: string | null) => {
              const option = document.createElement("calcite-option");
              option.value = option.label = option.textContent = header;
              select.appendChild(option);

              // Auto-select default if matches expected
              if (
                defaultNames[key].some(
                  (defaultNamesValue: string) =>
                    defaultNamesValue.toLowerCase() === header.toLowerCase(),
                )
              ) {
                select.value = header;
              }
            });
          }
        } catch (error) {
          console.error("Error parsing CSV:", error);
          columnPanel.hidden = true;
          alert.open = true;
        } finally {
          dialog.loading = false;
        }
      });

      buttonSave?.addEventListener("click", async function () {
        dialog.loading = true;

        const startTime = performance.now(); // for loading time
        // Load default file if none selected
        const defaultCSVUrl =
          "https://raw.githubusercontent.com/DP-00/BirdTracker/refs/heads/main/data/hbCH_cut.csv";
        let text: string;

        if (!csvInput?.files?.length) {
          try {
            const response = await fetch(defaultCSVUrl);
            text = await response.text();
          } catch (error) {
            console.error("Error loading default CSV:", error);
            alert.open = true;
            dialog.loading = false;
            return;
          }

          dataParsed = text.split(/\r?\n/).filter((row) => row.trim() !== "");

          columnNames = {
            birdid: "individual-local-identifier",
            longitude: "long",
            latitude: "lat",
            altitude: "height-above-ellipsoid",
            speed: "ground-speed",
            timestamp: "timestamp",
          };

          fileSize = 8;
        }

        [dataProcessed, statJSON] = processCSV(dataParsed, columnNames);

        console.log("Parsed CSV Data:", dataProcessed);
        console.log(
          `Data: ${Object.keys(dataProcessed).length} tracks, ${dataParsed.length} points, ${fileSize} MB, ${((performance.now() - startTime) / 1000).toFixed(2)} s`,
        );

        if (dataProcessed.length === 0) {
          alert.open = true;
          columnPanel.hidden = true;
          dialog.loading = false;
          csvInput.value = "";
        } else {
          let lineLayer = await createLineLayer(dataProcessed);
          let generalizedLayer =
            await createGeneralizedLineLayer(dataProcessed);
          await arcgisMap.addLayers([lineLayer, generalizedLayer]);
          await lineLayer.when(); // wait until loaded

          if (lineLayer.timeInfo) {
            timeSlider.view = arcgisMap.view;
            timeSlider.fullTimeExtent = lineLayer.timeInfo.fullTimeExtent;
          }
          setTimeout(() => {
            // buttonSave.loading = false;
            dialog.loading = false;
            dialog.open = false;
          }, 1600);
        }
      });

      // TIME SLIDER SETTINGS

      // timeSlider.addEventListener("arcgisPropertyChange", (event) => {
      //   arcgisMap.view.environment.lighting.date = new Date(
      //     timeSlider.timeExtent.end,
      //   );
      // });
      // Timeline controls
      document
        .getElementById("time-window")
        .addEventListener("calciteSelectChange", (e) => {
          const hours = parseInt(e.target.value);
          const end = new Date(timeSlider.timeExtent.end);
          let start = new Date(end.getTime() - hours * 3600000);
          if (start < new Date(timeSlider.fullTimeExtent.start)) {
            start = new Date(timeSlider.fullTimeExtent.start);
          }
          timeSlider.timeExtent = new TimeExtent({
            start,
            end,
          });
        });
      document.getElementById("speed").addEventListener("input", (e) => {
        timeSlider.playRate = parseFloat(e.target.value);
      });
      document
        .getElementById("stops")
        .addEventListener("calciteSelectChange", (e) => {
          timeSlider.stops = {
            interval: {
              value: 1,
              unit: e.target.value,
            },
          };
        });
    });
  }

  render() {
    // const store = this.store;

    return (
      <div>
        <LoadingPanel></LoadingPanel>
        <arcgis-scene
          basemap="satellite"
          ground="world-elevation"
          zoom="8"
          center="9.5,45"
          onArcgisViewReadyChange={(e: ArcgisSceneCustomEvent<void>) =>
            this.bindView(e.target)
          }
        >
          <arcgis-zoom position="top-left"></arcgis-zoom>
          <arcgis-navigation-toggle
            position="top-left"
            group="top-left"
          ></arcgis-navigation-toggle>
          <arcgis-compass position="top-left" group="top-left"></arcgis-compass>
          <arcgis-expand position="top-left" group="top-left">
            <arcgis-search></arcgis-search>
          </arcgis-expand>

          <arcgis-expand position="top-left" group="top-left">
            <arcgis-layer-list position="top-right"></arcgis-layer-list>
          </arcgis-expand>
          <arcgis-expand position="top-left" group="top-left">
            <arcgis-basemap-gallery></arcgis-basemap-gallery>
          </arcgis-expand>
          <arcgis-expand position="top-left" group="top-left">
            <arcgis-daylight
              position="bottom-right"
              hide-date-picker
              hide-timezone
              hide-play-buttons
            ></arcgis-daylight>
          </arcgis-expand>
          <arcgis-expand position="top-left" group="top-left">
            <arcgis-directline-measurement-3d></arcgis-directline-measurement-3d>
          </arcgis-expand>
          <arcgis-expand position="top-left" group="top-left">
            <arcgis-area-measurement-3d></arcgis-area-measurement-3d>
          </arcgis-expand>

          <arcgis-placement position="top-right">
            <div id="dashboard" class="esri-widget">
              <p>
                <h2>
                  Birdtracker{" "}
                  <calcite-button
                    appearance="transparent"
                    icon-start="information"
                    kind="neutral"
                    round
                    scale="s"
                  ></calcite-button>
                </h2>
              </p>
              <div id="time-controls">
                <calcite-label layout="inline">
                  Time Window:
                  <calcite-select id="time-window">
                    <calcite-option value="1">1h</calcite-option>
                    <calcite-option value="12" selected>
                      12h
                    </calcite-option>
                    <calcite-option value="24">24h</calcite-option>
                  </calcite-select>
                </calcite-label>

                <calcite-label layout="inline">
                  Interval:
                  <calcite-select id="stops">
                    <calcite-option value="minutes">minutes</calcite-option>
                    <calcite-option value="hours" selected>
                      hours
                    </calcite-option>
                    <calcite-option value="days">days</calcite-option>
                  </calcite-select>
                </calcite-label>

                <calcite-label layout="inline">
                  Speed:
                  <input
                    type="range"
                    id="speed"
                    min="100"
                    max="1000"
                    step="10"
                    value="100"
                  ></input>
                </calcite-label>
              </div>
              <arcgis-time-slider
                position="bottom-right"
                mode="time-window"
                play-rate="1"
                time-visible
                loop
                stops-interval-value="1"
                stops-interval-unit="hours"
              ></arcgis-time-slider>
            </div>
          </arcgis-placement>
        </arcgis-scene>

      </div>
    );
  }
}

const LoadingPanel = () => {
  return (
    <calcite-dialog
      modal
      open
      close-disabled="true"
      escape-disabled="true"
      outside-close-disabled="true"
      id="loading-dialog"
      heading="Welcome to the app!"
    >
      <calcite-tabs>
        <calcite-tab-nav slot="title-group">
          <calcite-tab-title selected>Data loading</calcite-tab-title>
          <calcite-tab-title>About</calcite-tab-title>
          <calcite-tab-title>Tutorial</calcite-tab-title>
        </calcite-tab-nav>

        <calcite-tab selected>
          <h3>Upload file</h3>
          <p>Choose the file that contains bird data in a CSV format </p>
          <calcite-notice icon="information" open>
            <div slot="message">Leave empty to use sample data</div>
          </calcite-notice>
          <input type="file" id="csv-input" accept=".csv" />
          <calcite-alert
            id="loading-error"
            kind="danger"
            icon
            label="Danger alert"
            auto-close
            scale="m"
          >
            <div slot="title">
              There has been an error while loading the data
            </div>
          </calcite-alert>
          <calcite-panel id="column-assignment" hidden>
            <h3>Assign column names</h3>
            <calcite-label layout="inline-space-between">
              Bird ID
              <calcite-select required id="id-select"></calcite-select>
            </calcite-label>
            <calcite-label layout="inline-space-between">
              Longitude
              <calcite-select required id="lon-select"></calcite-select>
            </calcite-label>
            <calcite-label layout="inline-space-between">
              Latitude
              <calcite-select required id="lat-select"></calcite-select>
            </calcite-label>
            <calcite-label layout="inline-space-between">
              Elevation
              <calcite-select required id="elev-select"></calcite-select>
            </calcite-label>
            <calcite-label layout="inline-space-between">
              Speed
              <calcite-select required id="speed-select"></calcite-select>
            </calcite-label>
            <calcite-label layout="inline-space-between">
              Timestamp
              <calcite-select required id="timestamp-select"></calcite-select>
            </calcite-label>
          </calcite-panel>
        </calcite-tab>

        <calcite-tab></calcite-tab>

        <calcite-tab></calcite-tab>
      </calcite-tabs>

      <calcite-button id="save-button" slot="footer-end">
        Upload data
      </calcite-button>
    </calcite-dialog>
  );
};

export default App;
