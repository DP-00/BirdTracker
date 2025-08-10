import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import "@arcgis/map-components/components/arcgis-area-measurement-3d";
import "@arcgis/map-components/components/arcgis-basemap-gallery";
import "@arcgis/map-components/components/arcgis-compass";
import "@arcgis/map-components/components/arcgis-daylight";
import "@arcgis/map-components/components/arcgis-direct-line-measurement-3d";
import "@arcgis/map-components/components/arcgis-elevation-profile";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-features";
import "@arcgis/map-components/components/arcgis-fullscreen";
import "@arcgis/map-components/components/arcgis-home";
import "@arcgis/map-components/components/arcgis-layer-list";
import "@arcgis/map-components/components/arcgis-legend";
import "@arcgis/map-components/components/arcgis-navigation-toggle";
import "@arcgis/map-components/components/arcgis-placement";
import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-time-slider";
import "@arcgis/map-components/components/arcgis-zoom";

import AppStore from "../stores/AppStore";
import { Widget } from "./Widget";

import "@arcgis/core/geometry/operators/generalizeOperator";
import { ArcgisSceneCustomEvent } from "@arcgis/map-components";
import "@esri/calcite-components/dist/components/calcite-accordion";
import "@esri/calcite-components/dist/components/calcite-accordion-item";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-action-group";
import "@esri/calcite-components/dist/components/calcite-action-pad";
import "@esri/calcite-components/dist/components/calcite-alert";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-carousel";
import "@esri/calcite-components/dist/components/calcite-carousel-item";
import "@esri/calcite-components/dist/components/calcite-combobox";
import "@esri/calcite-components/dist/components/calcite-combobox-item";
import "@esri/calcite-components/dist/components/calcite-dialog";
import "@esri/calcite-components/dist/components/calcite-fab";
import "@esri/calcite-components/dist/components/calcite-handle";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-input-date-picker";
import "@esri/calcite-components/dist/components/calcite-input-time-picker";
import "@esri/calcite-components/dist/components/calcite-input-time-zone";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-link";
import "@esri/calcite-components/dist/components/calcite-list";
import "@esri/calcite-components/dist/components/calcite-list-item";
import "@esri/calcite-components/dist/components/calcite-list-item-group";
import "@esri/calcite-components/dist/components/calcite-loader";
import "@esri/calcite-components/dist/components/calcite-menu";
import "@esri/calcite-components/dist/components/calcite-menu-item";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-navigation-user";
import "@esri/calcite-components/dist/components/calcite-notice";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-popover";
import "@esri/calcite-components/dist/components/calcite-segmented-control";
import "@esri/calcite-components/dist/components/calcite-segmented-control-item";
import "@esri/calcite-components/dist/components/calcite-slider";
import "@esri/calcite-components/dist/components/calcite-sort-handle";
import "@esri/calcite-components/dist/components/calcite-sortable-list";
import "@esri/calcite-components/dist/components/calcite-stepper";
import "@esri/calcite-components/dist/components/calcite-stepper-item";
import "@esri/calcite-components/dist/components/calcite-switch";
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-tabs";
import "@esri/calcite-components/dist/components/calcite-tooltip";

import * as intl from "@arcgis/core/intl.js";
import { loadData } from "../dataLoading";
import { setMapControls } from "../mapControls";
intl.setLocale("en-gb");

type AppProperties = {};

const params = new URLSearchParams(document.location.search.slice(1));

@subclass()
class App extends Widget<AppProperties> {
  @property({ constructOnly: true })
  store = new AppStore();

  @property()
  private async bindView(arcgisScene: HTMLArcgisSceneElement) {
    const view = arcgisScene.view;
    view.theme = {
      accentColor: [55, 200, 100, 0.75],
      textColor: "green",
    };
    view.timeZone = "Etc/UTC";
    //@ts-ignore
    view.qualitySettings.bloom = true;
    view.popup = {
      defaultPopupTemplateEnabled: true,
      dockEnabled: false,
      dockOptions: {
        breakpoint: false,
        position: "top-right",
      },
    };
    view.environment.lighting = {
      cameraTrackingEnabled: false,
    };
    await loadData(arcgisScene);
    await setMapControls(arcgisScene);
  }

  render() {
    return (
      <div>
        <LoadingPanel></LoadingPanel>
        <div id="main-div">
          <div id="scene-wrapper">
            <arcgis-scene
              id="scene-div"
              basemap="satellite"
              ground="world-elevation"
              zoom="8"
              center="9.5,45"
              onArcgisViewReadyChange={(e: ArcgisSceneCustomEvent<void>) =>
                this.bindView(e.target)
              }
            >
              <arcgis-zoom position="top-left"></arcgis-zoom>
              <arcgis-navigation-toggle position="top-left"></arcgis-navigation-toggle>
              <arcgis-compass position="top-left"></arcgis-compass>
              <MapControls></MapControls>
              <arcgis-placement position="top-right"></arcgis-placement>
              <arcgis-placement
                id="time-placement"
                position="bottom-right"
              ></arcgis-placement>
            </arcgis-scene>
            <div id="gauges-container">
              <calcite-segmented-control id="camera-side" width="full">
                <calcite-segmented-control-item
                  value="bird-camera-front"
                  icon-start="chevrons-up"
                  checked
                >
                  Front view
                </calcite-segmented-control-item>
                <calcite-segmented-control-item
                  value="bird-camera-left"
                  icon-start="chevrons-right"
                >
                  Left side view
                </calcite-segmented-control-item>
                <calcite-segmented-control-item
                  value="bird-camera-right"
                  icon-start="chevrons-left"
                >
                  Right side view
                </calcite-segmented-control-item>
                <calcite-segmented-control-item
                  value="bird-camera-back"
                  icon-start="chevrons-down"
                >
                  Back view
                </calcite-segmented-control-item>
                <calcite-segmented-control-item
                  value="bird-camera-free"
                  icon-start="move"
                >
                  Free view
                </calcite-segmented-control-item>
              </calcite-segmented-control>

              <p id="time-dashboard"></p>
              <Gauges></Gauges>
            </div>
            <TimeControls></TimeControls>
          </div>
          <calcite-panel id="dashboard">
            <div id="dashboard-group-vis">
              <p>
                <h1 class="outlined">
                  BirdTracker
                  <img src="./birdIcon3.svg" width="25px" height="25px"></img>
                  {/* <calcite-button
                    appearance="transparent"
                    icon-start="information"
                    kind="neutral"
                    round
                    scale="l"
                  ></calcite-button> */}
                </h1>
              </p>

              <calcite-tabs layout="center" scale="l">
                <calcite-tab-nav slot="title-group">
                  <calcite-tab-title icon-start="question">
                    Tutorial
                  </calcite-tab-title>
                  <calcite-tab-title icon-start="line" selected>
                    Navigate tracks
                  </calcite-tab-title>

                  <calcite-tab-title icon-start="information">
                    About
                  </calcite-tab-title>
                </calcite-tab-nav>
                <calcite-tab>
                  <Tutorial></Tutorial>
                </calcite-tab>

                <calcite-tab>
                  <calcite-list
                    id="bird-list"
                    label="Bird list"
                    scale="l"
                  ></calcite-list>
                  <calcite-button
                    icon-end="layer-zoom-to"
                    id="zoom-group"
                    scale="l"
                  >
                    Center all <span id="nr-of-paths"></span> birds tracks
                  </calcite-button>
                </calcite-tab>
                <calcite-tab>
                  <About></About>
                </calcite-tab>
              </calcite-tabs>
            </div>
            <div id="dashboard-single-vis">
              <div id="dashboard-modes">
                <calcite-segmented-control
                  id="camera-control"
                  width="full"
                  appearance="outline-fill"
                  scale="m"
                >
                  <calcite-segmented-control-item
                    icon-start="gps-on"
                    value="bird"
                  >
                    Follow bird
                  </calcite-segmented-control-item>

                  <calcite-segmented-control-item
                    id="camera-zoom"
                    icon-start="line"
                    value="line"
                    checked
                  >
                    Explore path
                  </calcite-segmented-control-item>
                </calcite-segmented-control>
                <calcite-button
                  id="show-group-vis"
                  appearance="transparent"
                  kind="neutral"
                  scale="s"
                >
                  <span class="esri-icon">&#xe62f;</span>
                </calcite-button>
                <calcite-tooltip
                  reference-element="show-group-vis"
                  placement="bottom"
                >
                  Go back to the Group View
                </calcite-tooltip>
              </div>
              <p>
                <h2 id="birdid-header">
                  Bird <span id="dashboard-birdid"></span>
                </h2>
                <p id="dashboard-duration"></p>
                {/* <p id="dashboard-duration-selected"></p> */}
              </p>

              <div id="dashboard-info">
                <calcite-label alignment="start">
                  Line visualization:
                  <calcite-select id="primary-vis-select"></calcite-select>
                </calcite-label>
                <calcite-label alignment="end">
                  Cylinder visualization:
                  <calcite-select id="secondary-vis-select"></calcite-select>
                </calcite-label>
              </div>
              {/* 
                            <div id="dashboard-info">
                <p>Line visualization:</p>
                <p> Cylinder visualization:</p>
                <calcite-select id="primary-vis-select"></calcite-select>
                <calcite-select id="secondary-vis-select"></calcite-select>
              </div> */}

              <calcite-tabs layout="center">
                <calcite-tab-nav slot="title-group" id="dashboard-tabs-nav">
                  <calcite-tab-title icon-start="palette" selected>
                    Path<br></br>symbolization
                  </calcite-tab-title>
                  <calcite-tab-title icon-start="graph-time-series">
                    Line<br></br>chart
                  </calcite-tab-title>
                  <calcite-tab-title icon-start="altitude">
                    Elevation<br></br>profile
                  </calcite-tab-title>

                  <calcite-tab-title icon-start="partly-cloudy">
                    Weather<br></br>settings
                  </calcite-tab-title>
                </calcite-tab-nav>

                <calcite-tab>
                  <div id="color-scale-container">
                    <calcite-label layout="inline" class="layer-label">
                      <calcite-checkbox
                        id="visibility-line"
                        checked
                      ></calcite-checkbox>
                      <span id="line-variable"></span> (Line layer)
                    </calcite-label>
                    <calcite-label layout="inline" class="layer-label">
                      <calcite-checkbox
                        id="visibility-cylinders"
                        checked
                      ></calcite-checkbox>
                      <span id="cylinder-variable"></span> (Cylinder layer)
                    </calcite-label>

                    <div class="focus-padding">
                      <div id="color-slider-primary"></div>
                      <arcgis-legend
                        id="legend-primary"
                        reference-element="scene-div"
                        style="card"
                      ></arcgis-legend>
                      <div class="filters-container">
                        <calcite-icon icon="filter" scale="m" />
                        <div
                          id="prim-filter-container"
                          class="filter-container"
                        ></div>
                      </div>
                    </div>

                    <div class="focus-padding">
                      <div id="color-slider-secondary"></div>
                      <arcgis-legend
                        id="legend-secondary"
                        reference-element="scene-div"
                        style="card"
                      ></arcgis-legend>
                      <div class="filters-container">
                        <calcite-icon icon="filter" scale="m" />
                        <div
                          id="sec-filter-container"
                          class="filter-container"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="legend-label-container">
                    <h3>Helpers:</h3>

                    <div class="legend-row">
                      <calcite-checkbox
                        id="visibility-extremums"
                        checked
                      ></calcite-checkbox>
                      <span class="legend-text">
                        Extremums of line visualization
                      </span>
                      <span class="legend-icon-group">
                        <span class="legend-icon triangle green"></span>
                        <span class="legend-icon triangle red"></span>
                      </span>
                    </div>
                    <div class="legend-row">
                      <calcite-checkbox
                        id="visibility-generalized"
                        checked
                      ></calcite-checkbox>
                      <span class="legend-text">Generalized line</span>
                      <span
                        id="generalize-legend"
                        class="legend-icon generalized"
                      ></span>
                    </div>
                    <div class="legend-row">
                      <calcite-checkbox
                        id="visibility-timemarks"
                        checked
                      ></calcite-checkbox>
                      <span class="legend-text">
                        Time and distance marks along path
                      </span>
                      <span class="legend-icon square"></span>
                    </div>
                  </div>
                </calcite-tab>
                <calcite-tab>
                  <ChartsDashboard></ChartsDashboard>
                </calcite-tab>
                <calcite-tab>
                  <calcite-notice icon="information" open>
                    <div slot="message">
                      Zoom the chart by scrolling with your mouse wheel
                    </div>
                  </calcite-notice>
                  <arcgis-elevation-profile
                    label="test"
                    reference-element="scene-div"
                    hideClearButton={true}
                    hideSelectButton={true}
                    hideSettingsButton={true}
                    hideSketchButton={true}
                    highlightEnabled={false}
                    class="focus-padding"
                  ></arcgis-elevation-profile>
                </calcite-tab>
                <calcite-tab>
                  <WeatherControls></WeatherControls>
                </calcite-tab>
              </calcite-tabs>
            </div>
          </calcite-panel>
        </div>
      </div>
    );
  }
}

const LoadingPanel = () => {
  return (
    <div>
      {" "}
      <calcite-alert
        id="loading-error"
        kind="danger"
        icon
        label="Danger alert"
        auto-close
        scale="m"
      >
        <div slot="title">
          Data loading error - reload application to upload new dataset
        </div>
      </calcite-alert>
      <calcite-dialog
        modal
        open
        close-disabled="true"
        escape-disabled="true"
        outside-close-disabled="true"
        id="loading-dialog"
        heading="BIRDTRACKER"
        headingLevel={1}
      >
        <calcite-tabs>
          <calcite-tab-nav slot="title-group">
            <calcite-tab-title selected>Data loading</calcite-tab-title>
            <calcite-tab-title>Tutorial</calcite-tab-title>
            <calcite-tab-title>About</calcite-tab-title>
          </calcite-tab-nav>

          <calcite-tab selected>
            <h3>Upload file</h3>
            <p>Choose the file that contains bird data in a CSV format </p>
            <calcite-notice icon="information" open>
              <div slot="message">Maximum data size is around 250 MB</div>
            </calcite-notice>
            <input type="file" id="csv-input" accept=".csv" />

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
                Altitude
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

          <calcite-tab>
            <Tutorial></Tutorial>
          </calcite-tab>

          <calcite-tab>
            <About></About>
          </calcite-tab>
        </calcite-tabs>
        <calcite-button id="sample-button" slot="footer-end" kind="brand">
          Use sample data
        </calcite-button>
        <calcite-button
          id="save-button"
          slot="footer-end"
          kind="brand"
          disabled
        >
          Upload data
        </calcite-button>
      </calcite-dialog>
    </div>
  );
};

const ChartsDashboard = () => {
  return (
    <div>
      <calcite-notice icon="information" id="chart-notice" open>
        <div slot="message">
          Select numerical line variable to see the chart
        </div>
      </calcite-notice>
      <div id="chart-all-container">
        <h3>Values over selected time</h3>
        <div class="chart-container">
          <arcgis-chart id="line-chart"></arcgis-chart>
        </div>
        <div class="two-col-grid">
          <calcite-label id="chart-cursor-mode">
            Cursor mode
            <calcite-segmented-control layout="vertical" width="auto">
              <calcite-segmented-control-item
                id="chart-selection-map"
                icon-start="cursor-selection"
              >
                Selection with Map Sync
              </calcite-segmented-control-item>
              <calcite-segmented-control-item
                id="chart-selection"
                icon-start="select"
              >
                Selection
              </calcite-segmented-control-item>
              <calcite-segmented-control-item
                id="chart-zoom"
                icon-start="magnifying-glass"
                checked
              >
                Zoom
              </calcite-segmented-control-item>
            </calcite-segmented-control>
          </calcite-label>
          <arcgis-legend
            id="chart-secondary-legend"
            reference-element="scene-div"
            style="card"
          ></arcgis-legend>
        </div>
      </div>
    </div>
  );
};

const WeatherControls = () => {
  return (
    <div>
      <div id="weather-tiles-container">
        <h3>Generate weather tiles for selected time</h3>
        <calcite-notice icon="information" open>
          <div slot="message">
            Due to the weather API call limit: daily (10 000) and hourly (600)
            set the grid first to get only necessary data
          </div>
        </calcite-notice>

        <div class="two-col-grid">
          <p>Size of tile (km)</p>
          <calcite-slider
            id="weather-size"
            value="20"
            max={50}
            min={0}
            ticks={50}
            label-handles="true"
            label-ticks="true"
            style="width:250px"
          ></calcite-slider>

          <p>Maximum distance from path (km)</p>
          <calcite-slider
            id="weather-distance"
            value="4"
            max={30}
            min={1}
            ticks={30}
            label-handles="true"
            label-ticks="true"
            style="width:250px"
          ></calcite-slider>

          <calcite-button id="tiles-button" kind="neutral" appearance="solid">
            Generate tiles
          </calcite-button>
          <calcite-button
            id="weather-button"
            kind="neutral"
            appearance="solid"
            disabled
          >
            Get weather
          </calcite-button>
        </div>
      </div>
      <div id="weather-symbology-container">
        <h3>Weather symbology</h3>
        <calcite-notice icon="information" open>
          <div slot="message">
            Spatial and temporal resolution of the data varies depending on the
            available data in the region, see{" "}
            <calcite-link
              href="https://open-meteo.com/en/docs/model-updates#historical_weather_api"
              target="_blank"
            >
              documentation
            </calcite-link>{" "}
            for more details
          </div>
        </calcite-notice>
        <div class="two-col-grid">
          <div>
            <calcite-label layout="inline"></calcite-label>
            <calcite-label layout="inline">
              <calcite-checkbox
                id="weather-visibility"
                checked
              ></calcite-checkbox>
              Weather variable:
              <calcite-select id="weather-select">
                <calcite-option value="Temperature" selected>
                  Temperature
                </calcite-option>
                <calcite-option value="Pressure">Pressure</calcite-option>
                <calcite-option value="Precipitation">
                  Precipitation
                </calcite-option>
                <calcite-option value="Wind">Wind</calcite-option>
              </calcite-select>
            </calcite-label>
            <calcite-label id="weather-time-mapping" layout="inline">
              Temporal mapping:
              <calcite-label layout="inline">
                Along path
                <calcite-switch id="weather-time-switch"></calcite-switch>
                Constant
              </calcite-label>
            </calcite-label>
            <calcite-label layout="inline">
              <div id="weather-time-container"></div>
            </calcite-label>
            <calcite-tooltip
              reference-element="weather-time-mapping"
              placement="top"
            >
              Along path: shows the value based on time of the closest point on
              the path (ideal for migratory birds) <br></br>Constant: control
              the time at which values are shown(ideal resident birds)
            </calcite-tooltip>
          </div>
          <arcgis-legend
            id="weather-legend"
            reference-element="scene-div"
            style="card"
          ></arcgis-legend>
        </div>
        <calcite-button id="new-tiles-button" kind="neutral" appearance="solid">
          Generate new tiles
        </calcite-button>
      </div>
      <calcite-alert
        id="weather-alert-600"
        kind="danger"
        icon
        label="Danger alert"
        auto-close="true"
        auto-close-duration="slow"
      >
        <div slot="title">Weather tiles error: size limit</div>
        <div slot="message">Limit your grid to maximum 600 tiles</div>
      </calcite-alert>
      <calcite-alert
        id="weather-alert-14"
        kind="danger"
        icon
        label="Danger alert"
        auto-close="true"
        auto-close-duration="slow"
      >
        <div slot="title">Weather tiles error: duration limit</div>
        <div slot="message">Limit your grid to maximum 2 week period</div>
      </calcite-alert>
      <calcite-alert
        id="weather-alert-general"
        kind="danger"
        icon
        label="Danger alert"
        auto-close="true"
      >
        <div slot="title">Weather service error</div>
        <div slot="message">
          There has been an error with the weather service. Some of you data
          couldn't be requested. Check console for more details or try different
          request.
        </div>
      </calcite-alert>
    </div>
  );
};

const MapControls = () => {
  return (
    <arcgis-placement position="top-left">
      <arcgis-expand group="top-left" expand-tooltip="Search">
        <arcgis-search></arcgis-search>
      </arcgis-expand>

      <arcgis-expand group="top-left" expand-tooltip="Set basemap">
        <arcgis-basemap-gallery></arcgis-basemap-gallery>
      </arcgis-expand>
      <arcgis-expand group="top-left" expand-tooltip="Set thematic layers">
        <arcgis-layer-list id="thematic-layers"></arcgis-layer-list>
      </arcgis-expand>
      <arcgis-expand group="top-left" expand-tooltip="Control light">
        <arcgis-daylight
          hide-date-picker
          hide-timezone
          hide-play-buttons
        ></arcgis-daylight>
      </arcgis-expand>
      <arcgis-expand
        group="top-left"
        expand-icon="presentation"
        expand-tooltip="Slides"
      >
        <arcgis-placement>
          <Slides></Slides>
        </arcgis-placement>
      </arcgis-expand>
      <arcgis-expand group="top-left" expand-tooltip="Measure distance">
        <arcgis-directline-measurement-3d></arcgis-directline-measurement-3d>
      </arcgis-expand>
      <arcgis-expand group="top-left" expand-tooltip="Measure area">
        <arcgis-area-measurement-3d></arcgis-area-measurement-3d>
      </arcgis-expand>
    </arcgis-placement>
  );
};

const TimeControls = () => {
  return (
    <div id="time-slider">
      <calcite-button
        id="play-group-animation"
        icon-start="play-f"
        scale="m"
        appearance="transparent"
        kind="info"
      ></calcite-button>
      {/* <calcite-input-time-zone
        mode="name"
        id="timezone-picker"
        scale="s"
        value="Etc/UTC"
      ></calcite-input-time-zone> */}
      <calcite-combobox
        id="animation-playrate"
        placeholder="Animation speed"
        clear-disabled="true"
        selection-mode="single"
        selection-display="all"
      >
        <calcite-combobox-item value={1} heading="x 1"></calcite-combobox-item>
        <calcite-combobox-item
          value={5}
          heading="x 5"
          selected
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={10}
          heading="x 10"
        ></calcite-combobox-item>
        <calcite-combobox-item value={5} heading="x 50"></calcite-combobox-item>
        <calcite-combobox-item
          value={100}
          heading="x 100"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={500}
          heading="x 500"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={1000}
          heading="x 1000"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={10000}
          heading="x 10 000"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={50000}
          heading="x 50 000"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={100000}
          heading="x 100 000"
        ></calcite-combobox-item>
      </calcite-combobox>

      <calcite-popover
        heading="Edit time extent"
        label="Edit time extent"
        reference-element="edit-time-button"
        closable
        placement="top"
        id="popover-time"
      >
        <div>
          <calcite-label id="date-picker-start">
            Start Date:
            <calcite-input-date-picker
              id="start-date"
              lang="en-GB"
            ></calcite-input-date-picker>
            <calcite-input-time-picker
              id="start-time"
              hour-format="24"
            ></calcite-input-time-picker>
          </calcite-label>
          <calcite-label>
            Current Date:
            <calcite-input-date-picker
              id="end-date"
              lang="en-GB"
            ></calcite-input-date-picker>
            <calcite-input-time-picker
              id="end-time"
              hour-format="24"
            ></calcite-input-time-picker>
          </calcite-label>

          <calcite-button id="apply-range" appearance="solid">
            Apply
          </calcite-button>
        </div>
      </calcite-popover>
      <calcite-button
        id="edit-time-button"
        icon-start="pencil"
        appearance="transparent"
      ></calcite-button>
      {/* <span id="time-utc">UTC Zone</span> */}
      <calcite-button
        icon-start="layer-zoom-to"
        id="time-zoom"
        appearance="transparent"
      >
        Center visible path
      </calcite-button>

      <span id="time-duration"></span>

      <span id="time-distance"></span>
      <calcite-tooltip reference-element="time-distance" placement="top">
        ⏲↠ Horizontal speed: straight-line distance ÷ time <br></br>⏲↟
        Vertical speed: elevation diff ÷ time <br></br>⇤⇥ Distance: Sum of
        distances between all points
      </calcite-tooltip>
      <arcgis-time-slider
        layout="compact"
        reference-element="scene-div"
        position="bottom-right"
        mode="time-window"
        play-rate="100"
        time-visible="true"
        loop
        stops-interval-value="1"
        stops-interval-unit="minutes"
      ></arcgis-time-slider>
    </div>
  );
};

const Gauges = () => {
  return (
    <div>
      <canvas
        id="speedGauge"
        data-width="270"
        data-height="270"
        data-type="radial-gauge"
        data-units="km/h"
        data-title="Speed"
        data-min-value="0"
        data-max-value="30"
        data-highlights="[]"
        data-major-ticks='["0", "5", "10", "15", "20", "25", "30"]'
        data-minor-ticks="5"
        data-value-int="1"
        data-value-dec="0"
        data-stroke-ticks="true"
        data-borders="false"
        data-font-title-size="30"
        data-font-ticks-size="50"
        data-font-units-size="30"
        data-font-value-size="50"
        data-value-box-stroke="0"
        data-color-value-text="#aed8cc"
        data-color-value-box-background="false"
        data-color-plate="#192a276e"
        data-color-title="#aed8cc"
        data-color-units="#aed8cc"
        data-color-numbers="#aed8cc"
        data-color-major-ticks="#aed8cc"
        data-color-minor-ticks="#aed8cc"
        data-color-needle="#aed8cc"
        data-color-needle-end="#aed8cc"
        data-color-needle-circle-outer="#aed8cc"
        data-color-needle-circle-inner="#aed8cc"
        data-value-text-shadow="true"
        data-color-value-text-shadow="#aed8cc"
        data-needle-circle-size="7"
        data-needle-circle-outer="true"
        data-needle-circle-inner="false"
        data-value-box="true"
        data-animation-rule="linear"
        data-animation-duration="40"
        data-value="0"
      ></canvas>

      <canvas
        id="headingGauge"
        data-width="230"
        data-height="230"
        data-type="radial-gauge"
        data-title=""
        data-min-value="0"
        data-max-value="360"
        data-highlights="[]"
        data-major-ticks='["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"]'
        data-minor-ticks="22"
        data-ticks-angle="360"
        data-start-angle="180"
        data-value-int="1"
        data-value-dec="0"
        data-stroke-ticks="false"
        data-borders="false"
        data-needle-type="arrow"
        data-needle-start="60"
        data-needle-end="80"
        data-needle-width="5"
        data-border-inner-width="0"
        data-border-middle-width="0"
        data-border-outer-width="10"
        data-color-border-outer="#aed8cc"
        data-color-border-outer-end="#aed8cc"
        data-border-shadow-width="0"
        data-animation-target="plate"
        data-color-plate="#192a276e"
        data-color-title="#aed8cc"
        data-color-units="#aed8cc"
        data-color-numbers="#aed8cc"
        data-color-major-ticks="#aed8cc"
        data-color-minor-ticks="#aed8cc"
        data-color-needle="#aed8cc"
        data-color-needle-end="#aed8cc"
        data-color-needle-circle-outer="#aed8cc"
        data-color-needle-circle-inner="#aed8cc"
        data-needle-circle-size="7"
        data-needle-circle-outer="true"
        data-needle-circle-inner="false"
        data-animation-rule="linear"
        data-animation-duration="40"
        data-value="0"
        data-value-box="false"
      ></canvas>

      <canvas
        id="altitudeGauge"
        data-width="150"
        data-height="450"
        data-type="linear-gauge"
        data-title="Altitude"
        data-units="m.a.s.l."
        data-min-value="0"
        data-max-value="5000"
        data-highlights="[]"
        data-major-ticks='["0", "500", "1500", "2000", "2500", "3000", "3500", "4000", "4500", "5000"]'
        data-minor-ticks="5"
        data-value-int="1"
        data-value-dec="0"
        data-stroke-ticks="true"
        data-bar-width="20"
        data-color-plate="#192a276e"
        data-border-shadow-width="0"
        data-borders="false"
        data-needle-type="arrow"
        data-needle-width="2"
        data-animation-duration="40"
        data-animation-rule="linear"
        data-tick-side="left"
        data-number-side="left"
        data-needle-side="left"
        data-bar-stroke-width="0"
        data-bar-begin-circle="false"
        data-value-box-stroke="0"
        data-color-value-box-background="false"
        data-color-title="#aed8cc"
        data-color-value-text="#aed8cc"
        data-color-units="#aed8cc"
        data-color-numbers="#aed8cc"
        data-color-major-ticks="#aed8cc"
        data-color-minor-ticks="#aed8cc"
        data-color-needle="#aed8cc"
        data-color-needle-end="#aed8cc"
        data-color-bar-progress="#aed8cc"
        data-color-bar="#192a276e"
        data-font-title-size="30"
        data-font-units-size="30"
        data-font-value-size="50"
        data-value-text-shadow="true"
        data-color-value-text-shadow="#aed8cc"
        data-value="0"
      ></canvas>
    </div>
  );
};

const Slides = () => {
  return (
    <calcite-panel id="slidesDashboard" heading="Slides" scale="l">
      <calcite-list id="slidesDiv" drag-enabled></calcite-list>
      <calcite-label layout="inline" scale="l" slot="footer">
        Add slide:
        <calcite-input
          id="createSlideTitleInput"
          placeholder="Enter name"
          scale="m"
        >
          <calcite-button
            id="createSlideButton"
            slot="action"
            scale="m"
            kind="neutral"
            appearance="solid"
          >
            Create
          </calcite-button>
        </calcite-input>
      </calcite-label>
    </calcite-panel>
  );
};

const Tutorial = () => {
  return (
    <calcite-stepper id="tutorial" numbered>
      <calcite-stepper-item heading="Data Loading" selected>
        <ul class="tutorial-guidelines">
          <li>Data must include at least 6 attributes:</li>
          <ul>
            <li>
              <strong>ID:</strong> differentiates individual birds
            </li>
            <li>
              <strong>Longitude, Latitude, Altitude:</strong> 3D position of the
              bird
            </li>
            <li>
              <strong>Time:</strong> UTC timestamp for each location
            </li>
            <li>
              <strong>Speed:</strong> horizontal speed
            </li>
          </ul>
          <li>Remove outliers before uploading</li>
          <li>If issues occur, reload the page or try a smaller dataset</li>
        </ul>
        <calcite-notice icon="exclamation-point-f" open width="full">
          <div slot="title">Limit your data</div>
          <div slot="message">
            To optimize the performance include only necessary attributes and
            points in the dataset
          </div>
        </calcite-notice>
      </calcite-stepper-item>
      <calcite-stepper-item heading="App Structure" class="tutorial">
        <div class="image-placeholder">
          <img src="placeholder-image.png" alt="Instruction video" />
        </div>
        <h3>Application sections</h3>

        <ol>
          <li>
            <strong>Map:</strong> Displays various layers with popups
          </li>
          <li>
            <strong>Map Controls:</strong> Independent of the tracks; used to
            change basemaps, toggle thematic layers, adjust lighting, etc.
          </li>
          <li>
            <strong>Timeline:</strong> Controls time range or animation
          </li>
          <li>
            <strong>Dashboard:</strong> Displays track(s) information and
            settings
          </li>
        </ol>

        <h3>Application modes</h3>
        <ul class="tutorial-guidelines">
          <li>
            <strong>Group View:</strong> all uploaded tracks
          </li>
          <li>
            <strong>Single View:</strong> details on one track with different
            focus modes
          </li>
          <ul>
            <li>
              <strong>Explore mode:</strong> visualize the date with different
              variables and charts having the big overview
            </li>
            <li>
              <strong>Follow mode:</strong> focus on the bird perspective as
              they were flying
            </li>
          </ul>
        </ul>
      </calcite-stepper-item>
      <calcite-stepper-item heading="Map Navigation">
        <calcite-carousel arrow-type="edge">
          <calcite-carousel-item>
            <h3>Spatial Navigation</h3>
            <ul class="nav-guidelines">
              <li>
                <span class="esri-nav-icon">&#xe667;</span>{" "}
                <strong>Pan: </strong> Right-click + drag to move sideways
              </li>
              <li>
                <span class="esri-nav-icon">&#xe66e;</span>
                <strong>Rotate: </strong> Left-click + drag to spin the view
                around a point
              </li>
              <li>
                <span class="esri-nav-icon">&#xe680;</span>{" "}
                <strong>Compass: </strong> Click N to set the nort-up view
              </li>
              <li>
                <span class="esri-nav-icon">&#xe620; &#xe621;</span>{" "}
                <strong>Zoom: </strong> Mouse wheel forward/backward to zoom in
                or out
              </li>
            </ul>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Temporal Navigation</h3>
            <ul class="tutorial-guidelines">
              <li>
                The options on the timeline change depending on the appliation
                view and mode
              </li>
              <li>Drag the bar to set the selected path time</li>
              <li>Use date picker for precise timespan</li>
              <li>
                When possible use the play button to start the animation and
                control the speed with right-upper corner control
              </li>
            </ul>
            <p></p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Data Navigation</h3>
            <ul class="tutorial-guidelines">
              <li>
                Change basemaps for better suitable background and information
              </li>
              <li>
                Switch between thematic layers to explore different datasets
              </li>

              <li>
                Try not to perform the actions on the map when you see the
                loading indicatior
              </li>
            </ul>
          </calcite-carousel-item>
        </calcite-carousel>
      </calcite-stepper-item>
      <calcite-stepper-item heading="Group view">
        <calcite-carousel arrow-type="edge">
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Animate movement</h3>
            <ul class="tutorial-guidelines">
              <li>Get overview of all the bird journeys using timeline</li>
              <li>The gray line shows the whole track</li>
              <li>The colored line shows last 24 hours</li>
            </ul>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Check by ID and paramenter</h3>
            <ul class="tutorial-guidelines">
              <li>Investigate based on list and get reference on the map</li>
              <li>
                Hover to highlight the track and click to open the path pop-up
              </li>
            </ul>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Investigate further</h3>
            <ul class="tutorial-guidelines">
              <li>
                {" "}
                Or select the genrelized path directly on the map to get a popup
              </li>
              <li>
                Go to the single view by clicking on the Investigate button
              </li>
            </ul>
          </calcite-carousel-item>
        </calcite-carousel>
      </calcite-stepper-item>
      <calcite-stepper-item heading="Single view">
        <calcite-carousel arrow-type="edge">
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Control Time and Camera</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>
                  Set the time range to the part to investigate. The shorter the
                  line the better performance. Some functionality like Charts
                  and Weather depends on the selected path.
                </li>
                <li>
                  Read the selected path depended info on the timeline
                  (duration, distance, speed)
                </li>
                <li>
                  Use the button on the timeline to zoom to selected path or
                  Explore Button to zoom to whole extent
                </li>
              </ul>
            </p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Path symbology</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>
                  Set the variables to color the line and cylinderalong the path
                </li>
                <li>Change the color scale</li>
                <li>Change the visibility of information along the path</li>
                <ul>
                  <li>
                    <strong>Line: </strong> seen from all zoom levels for
                    selected time
                  </li>
                  <li>
                    <strong>Cylinder: </strong> seen at closer level and showing
                    acctual data position for selected time
                  </li>
                  <li>
                    <strong>Time markers: </strong>show day and distance
                    distribution, set at 00:00 of each day
                  </li>
                  <li>
                    <strong>Generalized line: </strong> shows simlpified
                  </li>
                  <li>
                    <strong>Extremums: </strong> shows minimum and maximum value
                    of the line variable
                  </li>
                </ul>
                <li>
                  Click on each element on the map to get more information in
                  the popup
                </li>
              </ul>
            </p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Charts</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>
                  Show how the selected variables are changing along the
                  selected
                </li>
                <li>
                  line variable - shape of the path, cylinder variable - color
                </li>
                <li>
                  Change cursor mode to be able to to interact with the map or
                  zoom in the chart
                </li>
                <li>
                  To improve performance or in case of too many points error,
                  minimize the selected path with timeline
                </li>
              </ul>
            </p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Elevation profile</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>See track and ground changes along the distance</li>
                <li>
                  Hover over the chart to hihglight corresponding place on the
                  map and get exact value
                </li>
                <li>See statisctic about both elevation profiles</li>
              </ul>
            </p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Weather</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>Choose only relevant part of the path with the timeline</li>
                <li>
                  Generate the tiles and if the placement is correct get the
                  weather data
                </li>
                <li>
                  In case of too many requested grid cells minimize the selected
                  path with timeline or set bigger size tile with smaller
                  distance from the path
                </li>
                <li>
                  Click on the grid elements to get exact values and see
                  corresponding variables
                </li>
              </ul>
            </p>
          </calcite-carousel-item>
          <calcite-carousel-item>
            <div class="image-placeholder">
              <img src="placeholder-gif.gif" alt="Instruction video" />
            </div>
            <h3>Follow Bird</h3>
            <p>
              <ul class="tutorial-guidelines">
                <li>See what the bird saw during the flight</li>
                <li>Control the camera angle with the upper-screen buttons</li>
                <li>Control the place and speed with the timeline control</li>
                <li>Read the current values from the gauges</li>
                <li>Hide the uneccesary layers to improve animation</li>
                <li>
                  Go back to the Explore mode using the buttons at the top of
                  the dashboard
                </li>
              </ul>
            </p>
          </calcite-carousel-item>
        </calcite-carousel>
      </calcite-stepper-item>
    </calcite-stepper>
  );
};

const About = () => {
  return (
    <calcite-stepper id="about" numbered>
      <calcite-stepper-item heading="Teaser" selected>
        <p>TO BE ADDED</p>
      </calcite-stepper-item>
      <calcite-stepper-item heading="Inspiration"></calcite-stepper-item>
      <calcite-stepper-item heading="Authors"></calcite-stepper-item>
      <calcite-stepper-item heading="Attributions">
        <calcite-notice width="full" open>
          <div slot="title">Step 4 content</div>
        </calcite-notice>
      </calcite-stepper-item>
      <calcite-stepper-item heading="Disclaimers">
        <calcite-notice width="full" open>
          <div slot="title">Step 4 content</div>
        </calcite-notice>
      </calcite-stepper-item>
    </calcite-stepper>
  );
};
export default App;
