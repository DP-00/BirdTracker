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
import "@esri/calcite-components/dist/components/calcite-switch";
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-tabs";

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
                <h2 class="outlined">
                  BirdTracker
                  <img src="./birdIcon3.svg" width="25px" height="25px"></img>
                  {/* <calcite-button
                    appearance="transparent"
                    icon-start="information"
                    kind="neutral"
                    round
                    scale="l"
                  ></calcite-button> */}
                </h2>
              </p>

              <calcite-tabs layout="center" scale="l">
                <calcite-tab-nav slot="title-group">
                  <calcite-tab-title selected>Your tracks</calcite-tab-title>
                </calcite-tab-nav>
                <calcite-tab>
                  <calcite-list
                    id="bird-list"
                    label="Bird list"
                    scale="l"
                  ></calcite-list>
                </calcite-tab>
              </calcite-tabs>
              <calcite-button
                icon-end="layer-zoom-to"
                id="zoom-group"
                scale="l"
              >
                Show all <span id="nr-of-paths"></span> birds tracks
              </calcite-button>
            </div>
            <div id="dashboard-single-vis">
              <calcite-label>
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
              </calcite-label>
              <p>
                <h2 id="birdid-header">
                  <calcite-button
                    id="show-group-vis"
                    appearance="transparent"
                    icon-start="home"
                    kind="neutral"
                    round
                    scale="l"
                  ></calcite-button>
                  Bird <span id="dashboard-birdid"></span>
                </h2>
                <p id="dashboard-duration"></p>
                <p id="dashboard-duration-selected"></p>
              </p>

              <div id="dashboard-info">
                <p>Line visualization:</p>
                <p> Cylinder visualization:</p>
                <calcite-select id="primary-vis-select"></calcite-select>
                <calcite-select id="secondary-vis-select"></calcite-select>
              </div>

              <calcite-tabs layout="center">
                <calcite-tab-nav slot="title-group" id="dashboard-tabs-nav">
                  <calcite-tab-title icon-start="palette" selected>
                    Path<br></br>symbolization
                  </calcite-tab-title>
                  <calcite-tab-title icon-start="graph-time-series">
                    Values<br></br>over time
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

                    <div>
                      <div id="color-slider-primary"></div>
                      <arcgis-legend
                        id="legend-primary"
                        reference-element="scene-div"
                      ></arcgis-legend>
                      <div class="filters-container">
                        <calcite-icon icon="filter" scale="m" />
                        <div
                          id="prim-filter-container"
                          class="filter-container"
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div id="color-slider-secondary"></div>
                      <arcgis-legend
                        id="legend-secondary"
                        reference-element="scene-div"
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
                    <calcite-label layout="inline" alignment="center">
                      <calcite-checkbox
                        id="visibility-extremums"
                        checked
                      ></calcite-checkbox>
                      Extremums along line visualization
                    </calcite-label>
                    <calcite-label layout="inline" alignment="center">
                      <calcite-checkbox
                        id="visibility-generalized"
                        checked
                      ></calcite-checkbox>
                      Generalized line
                      {/* <span id="generalize-legend"></span> */}
                    </calcite-label>
                    <calcite-label layout="inline" alignment="center">
                      <calcite-checkbox
                        id="visibility-timemarks"
                        checked
                      ></calcite-checkbox>
                      Time marks along path
                    </calcite-label>
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
        heading="Welcome to the BirdTracker app!"
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

          <calcite-tab></calcite-tab>

          <calcite-tab></calcite-tab>
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
    <div class="chart-container">
      <arcgis-chart id="line-chart"></arcgis-chart>
      <arcgis-chart id="bar-chart"></arcgis-chart>

      {/* <calcite-button id="set-line-chart">Set chart</calcite-button>
      <calcite-button id="set-bar-chart">Set bar chart</calcite-button> */}
      <calcite-label id="set-time-chart" layout="inline">
        Time binning:
        <calcite-segmented-control>
          <calcite-segmented-control-item
            id="chart-time-days"
            icon-start="calendar"
          >
            Days
          </calcite-segmented-control-item>
          <calcite-segmented-control-item
            id="chart-time-hours"
            icon-start="date-time"
          >
            Hours
          </calcite-segmented-control-item>
          <calcite-segmented-control-item
            id="chart-time-minutes"
            icon-start="clock"
            checked
          >
            Minutes
          </calcite-segmented-control-item>
        </calcite-segmented-control>
      </calcite-label>
      <calcite-label layout="inline" id="chart-cursor-mode">
        Cursor mode
        <calcite-segmented-control>
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
      {/* <calcite-button id="zoom-chart">zoom chart</calcite-button>
      <calcite-button id="select-chart">select chart</calcite-button> */}
    </div>
  );
};

const WeatherControls = () => {
  return (
    <div>
      <div id="weather-tiles-container">
        <h3>Generate weather tiles</h3>
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
            <calcite-link href="https://open-meteo.com/en/docs/model-updates#historical_weather_api">
              documentation
            </calcite-link>{" "}
            for more details
          </div>
        </calcite-notice>
        <div class="two-col-grid">
          <div>
            <calcite-label layout="inline">
              Visible:
              <calcite-switch checked></calcite-switch>
            </calcite-label>
            <calcite-label layout="inline">
              Variable:
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
            <calcite-label layout="inline">
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
          </div>
          <arcgis-legend
            id="weather-legend"
            reference-element="scene-div"
            style="classic"
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
        {/* <arcgis-legend id="thematic-layers-legend"></arcgis-legend> */}
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
        scale="l"
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
        <calcite-combobox-item
          value={1}
          heading="x 1"
          selected
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={10}
          heading="x 10"
        ></calcite-combobox-item>
        <calcite-combobox-item
          value={100}
          heading="x 100"
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
      >
        <div id="popover-time">
          <calcite-label id="date-picker-start">
            Start Date:
            <calcite-input-date-picker id="start-date"></calcite-input-date-picker>
            <calcite-input-time-picker
              id="start-time"
              hour-format="24"
            ></calcite-input-time-picker>
          </calcite-label>
          <calcite-label>
            Current Date:
            <calcite-input-date-picker id="end-date"></calcite-input-date-picker>
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
      <span id="time-utc">UTC Zone</span>
      <span id="time-duration"></span>
      <span id="time-distance"></span>
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

export default App;
