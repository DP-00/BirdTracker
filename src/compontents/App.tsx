import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import { ArcgisSceneCustomEvent } from "@arcgis/map-components";
import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-compass";
import "@arcgis/map-components/dist/components/arcgis-daylight";
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
import Polyline from "@arcgis/core/geometry/Polyline";
import Graphic from "@arcgis/core/Graphic";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
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

  postInitialize() {
    requestAnimationFrame(() => {
      console.log("Widget initialized, DOM is ready!");

      const csvInput = document.getElementById("csv-input");
      const columnPanel = document.getElementById("column-assignment");
      const buttonSave = document.getElementById("save-button");
      const dialog = document.getElementById("example-dialog");
      const alert = document.getElementById("loading-error");
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

      let fileSize;
      let dataParsed;
      let headers;
      let dataProcessed;

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
          dataParsed = text.split(/\r?\n/).filter((row) => row.trim() !== "");
          headers = dataParsed[0]
            .split(",")
            .map((h) => h.trim().replace(/^"(.*)"$/, "$1"));

          for (const [key, select] of Object.entries(columnNames)) {
            if (!(select instanceof HTMLElement)) continue;
            select.innerHTML = ""; // Clear any existing options
            headers.forEach((header) => {
              const option = document.createElement("calcite-option");
              option.value = option.label = option.textContent = header;
              select.appendChild(option);

              // Auto-select default if matches expected
              if (
                defaultNames[key].some(
                  (defaultNamesValue) =>
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

        dataProcessed = processCSV(dataParsed, columnNames);

        console.log("Parsed CSV Data:", dataProcessed);
        console.log(
          `Data: ${dataParsed.length} points, ${fileSize} MB, ${((performance.now() - startTime) / 1000).toFixed(2)} s`,
        );

        if (dataProcessed.length === 0) {
          alert.open = true;
          columnPanel.hidden = true;
          dialog.loading = false;
          csvInput.value = "";
        } else {
          let lineLayer = createLineLayer(dataProcessed);
          let generalizedLayer =
            await createGeneralizedLineLayer(dataProcessed);
          const arcgisMap = document.querySelector(
            "arcgis-scene",
          ) as HTMLArcgisSceneElement;
          await arcgisMap.addLayers([lineLayer, generalizedLayer]);
          await lineLayer.when(); // wait until loaded

          const timeSlider = document.querySelector("arcgis-time-slider");
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
    });

    function processCSV(lines, columnNames) {
      const getColumnValue = (key) => {
        const column = columnNames[key];
        return typeof column === "string" ? column : column?.value;
      };

      let headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"(.*)"$/, "$1"));

      lines.pop(); // Remove the last line

      const groupedByBird = {};

      lines.slice(1).map((line) => {
        const values = line.split(",");
        let row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index] ? values[index].trim() : "";
        });

        const birdid = row[getColumnValue("birdid")] ?? "unknown";
        const longitude = parseFloat(row[getColumnValue("longitude")]);
        const latitude = parseFloat(row[getColumnValue("latitude")]);

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
          altitude: parseFloat(row[getColumnValue("altitude")]),
          speed: parseFloat(row[getColumnValue("speed")]),
          timestamp: new Date(row[getColumnValue("timestamp")]),
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
      });

      return groupedByBird; // return grouped data

      // return parsedData.filter((row) => row !== null); // remove invalid rows
    }

    function getRandomColor() {
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 70%, 50%)`;
    }

    async function createGeneralizedLineLayer(groupedData) {
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

        // const generalizedPolyline = await generalizeOperator.execute(
        //   polyline,
        //   0.1,
        // );

        console.log(polyline);

        const lineGraphic = new Graphic({
          geometry: polyline,
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
            color: [50, 50, 50, 0.5],
            width: 15,
          },
        },
      });
    }

    function createLineLayer(groupedData) {
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

      const lineGraphics = [];
      let idCounter = 1;
      for (const birdid in groupedData) {
        const data = groupedData[birdid];
        const color = getRandomColor();

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
                  [
                    startPoint.longitude,
                    startPoint.latitude,
                    startPoint.altitude,
                  ],
                  [endPoint.longitude, endPoint.latitude, endPoint.altitude],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
            symbol: {
              type: "simple-line",
              color: color,
              width: 5,
            },
            attributes: {
              ObjectID: idCounter++,
              birdid,
              altitude,
              speed: startPoint.speed,
              timestamp: startPoint.timestamp.getTime(),
              longitude: startPoint.longitude,
              latitude: startPoint.latitude,
            },
          });
          lineGraphics.push(lineGraphic);
        }
      }

      return new FeatureLayer({
        title: "Line - altitude",
        source: lineGraphics,
        objectIdField: "ObjectID",
        geometryType: "polyline",
        elevationInfo: {
          mode: "absolute-height",
        },
        timeInfo: timeInfo,
        fields: fields,
        renderer: {
          type: "simple",
          symbol: {
            type: "line-3d",
            symbolLayers: [
              // new LineSymbol3DLayer({}),
              {
                type: "line",
                size: 5,
                cap: "round",
                join: "round",
                material: { color: [255, 0, 0] },
              },
            ],
          },
        },
      });
    }
  }

  @property()
  webSceneId = params.get("webscene") || "91b46c2b162c48dba264b2190e1dbcff";

  private bindView(arcgisScene: HTMLArcgisSceneElement) {
    const view = arcgisScene.view;
    // this.store.sceneStore.view = view;
  }

  render() {
    // const store = this.store;

    return (
      <div>
        {/* <calcite-shell class="app-shell"> */}
        {/* <AppNavigation store={store}></AppNavigation> */}

        {/* <calcite-shell-panel slot="panel-start" collapsed>
            <AppMenu store={store}></AppMenu>
          </calcite-shell-panel> */}

        {/* <calcite-panel>
            <calcite-shell content-behind="true" class="scene-shell">
              <calcite-shell-panel slot="panel-start" display-mode="float">
                <AppPanel store={store}></AppPanel>
              </calcite-shell-panel>
            </calcite-shell> */}
        <calcite-dialog
          modal
          open
          id="example-dialog"
          close-disabled
          escape-disabled
          heading="Welcome to the app!"
          outside-close-disabled
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
                  <calcite-select
                    required
                    id="timestamp-select"
                  ></calcite-select>
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

        <arcgis-scene
          basemap="satellite"
          ground="world-elevation"
          zoom="8"
          center="9.5,45"
          onArcgisViewReadyChange={(e: ArcgisSceneCustomEvent<void>) =>
            this.bindView(e.target)
          }
        >
          <arcgis-zoom position="top-left" group="top-left"></arcgis-zoom>
          <arcgis-navigation-toggle
            position="top-left"
            group="top-left"
          ></arcgis-navigation-toggle>
          <arcgis-compass position="top-left" group="top-left">
            {" "}
          </arcgis-compass>
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
              <arcgis-time-slider
                position="bottom-right"
                mode="time-window"
                play-rate="1"
                time-visible
                loop
              ></arcgis-time-slider>
            </div>
          </arcgis-placement>
        </arcgis-scene>

        {/* </calcite-panel> */}
        {/* </calcite-shell> */}
      </div>
    );
  }
}

// const AppNavigation = ({ store }: { store: AppStore }) => {
//   const portalItem = store.sceneStore.map?.portalItem;
//   const itemPageUrl = portalItem?.itemPageUrl;

//   const userStore = store?.userStore;

//   const user = (userStore?.authenticated && userStore?.user) || null;

//   return (
//     <calcite-navigation slot="header">
//       <calcite-navigation-logo
//         slot="logo"
//         heading={portalItem?.title}
//         description="ArcGIS Maps SDK for JavaScript"
//         thumbnail="./icon-64.svg"
//         onclick={() => {
//           if (itemPageUrl) {
//             window.open(itemPageUrl, "new");
//           }
//         }}
//       ></calcite-navigation-logo>

//       <Player store={store.playerStore}></Player>

//       {user ? (
//         <calcite-navigation-user
//           slot="user"
//           thumbnail={user.thumbnailUrl}
//           full-name={user.fullName}
//           username={user.username}
//         ></calcite-navigation-user>
//       ) : (
//         <calcite-menu slot="content-end">
//           <calcite-menu-item
//             onclick={() => userStore?.signIn()}
//             text="Sign in"
//             icon-start="user"
//             text-enabled
//           ></calcite-menu-item>
//         </calcite-menu>
//       )}
//     </calcite-navigation>
//   );
// };

// const Player = ({ store }: { store: PlayerStore }) => {
//   if (store.state === "starting") {
//     return (
//       <calcite-button
//         key="cancel"
//         appearance="outline"
//         kind="neutral"
//         slot="content-center"
//         style="align-self: center;"
//         loading
//         onclick={() => store.stop()}
//       >
//         Starting - press to cancel
//       </calcite-button>
//     );
//   } else if (store.state !== "animating") {
//     return (
//       <calcite-button
//         key="start"
//         slot="content-center"
//         icon-start="video-web"
//         style="align-self: center;"
//         disabled={store.state === "loading"}
//         onclick={() => store.play()}
//       >
//         Animate slides
//       </calcite-button>
//     );
//   } else {
//     return [];
//   }
// };

// const AppMenu = ({ store }: { store: AppStore }) => {
//   const toggleMenu = (menu: ActionMenu) => {
//     if (store.selectedMenu === menu) {
//       store.selectedMenu = null;
//     } else {
//       store.selectedMenu = menu;
//     }
//   };

//   return (
//     <calcite-action-bar slot="action-bar" class="calcite-mode-dark">
//       <calcite-action
//         icon="presentation"
//         text="Slides"
//         active={store.selectedMenu === "slides"}
//         onclick={() => toggleMenu("slides")}
//       ></calcite-action>
//       <calcite-action
//         icon="effects"
//         text="Animation"
//         active={store.selectedMenu === "animation"}
//         onclick={() => toggleMenu("animation")}
//       ></calcite-action>
//       <calcite-action
//         icon="gear"
//         text="Settings"
//         active={store.selectedMenu === "settings"}
//         onclick={() => toggleMenu("settings")}
//       ></calcite-action>
//     </calcite-action-bar>
//   );
// };

// const AppPanel = ({ store }: { store: AppStore }) => {
//   switch (store.selectedMenu) {
//     case "slides":
//       return (
//         <SlidesPanel
//           store={store.playerStore}
//           onclose={() => (store.selectedMenu = null)}
//         ></SlidesPanel>
//       );
//     case "animation":
//       return (
//         <AnimationPanel
//           store={store}
//           onclose={() => (store.selectedMenu = null)}
//         ></AnimationPanel>
//       );
//     case "settings":
//       return (
//         <SettingsPanel
//           store={store}
//           onclose={() => (store.selectedMenu = null)}
//         ></SettingsPanel>
//       );
//     default:
//       return <div></div>;
//   }
// };

export default App;
