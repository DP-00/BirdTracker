import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import "@arcgis/map-components/dist/components/arcgis-area-measurement-3d";
import "@arcgis/map-components/dist/components/arcgis-basemap-gallery";
import "@arcgis/map-components/dist/components/arcgis-compass";
import "@arcgis/map-components/dist/components/arcgis-daylight";
import "@arcgis/map-components/dist/components/arcgis-directline-measurement-3d";
import "@arcgis/map-components/dist/components/arcgis-elevation-profile";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-features";
import "@arcgis/map-components/dist/components/arcgis-fullscreen";
import "@arcgis/map-components/dist/components/arcgis-home";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-navigation-toggle";
import "@arcgis/map-components/dist/components/arcgis-placement";
import "@arcgis/map-components/dist/components/arcgis-scene";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-time-slider";
import "@arcgis/map-components/dist/components/arcgis-zoom";

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
import "@esri/calcite-components/dist/components/calcite-handle";
import "@esri/calcite-components/dist/components/calcite-input";
import "@esri/calcite-components/dist/components/calcite-input-time-zone";
import "@esri/calcite-components/dist/components/calcite-label";
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

import { loadData } from "../dataLoading";
import { setBasemaps, setSlides, setThematicLayers } from "../mapControls";

type AppProperties = {};

const params = new URLSearchParams(document.location.search.slice(1));

@subclass()
class App extends Widget<AppProperties> {
  @property({ constructOnly: true })
  store = new AppStore();

  @property()
  webSceneId = params.get("webscene") || "91b46c2b162c48dba264b2190e1dbcff";

  private async bindView(arcgisScene: HTMLArcgisSceneElement) {
    const view = arcgisScene.view;
    view.theme = {
      accentColor: [55, 200, 100, 0.75],
      textColor: "green",
    };
    view.popup!.defaultPopupTemplateEnabled = true;

    await loadData(arcgisScene);
    setSlides(arcgisScene);
    setBasemaps();
    setThematicLayers(arcgisScene);
    let myLayer = view.map.layers.find(function (layer) {
      return layer.id === "primaryLayer";
    });
    // console.log("l", view.map.layers, myLayer);
  }

  render() {
    // const store = this.store;

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
              <calcite-segmented-control
                id="bird-camera-control"
                width="full"
                appearance="outline-fill"
                scale="m"
              >
                <calcite-segmented-control-item
                  icon-start="chevrons-down"
                  value="bird-camera-front"
                >
                  Front view
                </calcite-segmented-control-item>

                <calcite-segmented-control-item
                  icon-start="chevrons-right"
                  value="bird-camera-side"
                >
                  Side view
                </calcite-segmented-control-item>
                <calcite-segmented-control-item
                  icon-start="chevrons-up"
                  value="bird-camera-back"
                  checked
                >
                  Back view
                </calcite-segmented-control-item>
              </calcite-segmented-control>
              <p id="time-dashboard"></p>
              <canvas id="speedGauge"></canvas>
              <canvas id="headingGauge"></canvas>
              <canvas id="altitudeGauge"></canvas>
            </div>
            <div id="time-slider">
              <TimeControls></TimeControls>
              <arcgis-time-slider
                layout="auto"
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
          </div>
          <div id="dashboard" class="esri-widget">
            <p>
              <h2>
                Bird <span id="dashboard-birdid"></span>
                <calcite-button
                  appearance="transparent"
                  icon-start="information"
                  kind="neutral"
                  round
                  scale="s"
                ></calcite-button>
              </h2>
              <p id="dashboard-duration"></p>
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
            </p>
            <div id="dashboard-info">
              <p>Primary visualization:</p>
              <p> Secondary visualization:</p>
              <calcite-select id="primary-vis-select"></calcite-select>
              <calcite-select id="secondary-vis-select"></calcite-select>
              <div id="prim-filter-container"></div>
              <div id="sec-filter-container"></div>
            </div>

            <calcite-tabs layout="center">
              <calcite-tab-nav slot="title-group">
                <calcite-tab-title icon-start="palette" selected>
                  Color scale
                </calcite-tab-title>
                <calcite-tab-title icon-start="graph-time-series">
                  Charts
                </calcite-tab-title>

                <calcite-tab-title icon-start="view-visible">
                  Visibility
                </calcite-tab-title>
                <calcite-tab-title icon-start="partly-cloudy">
                  Weather
                </calcite-tab-title>
              </calcite-tab-nav>
              {/* <OverviewDashboard></OverviewDashboard> */}
              {/* <VisDashboard></VisDashboard> */}

              <calcite-tab>
                {/* <arcgis-legend reference-element="scene-div"></arcgis-legend> */}
                <div id="color-scale-container">
                  <p>Primary color scale</p>
                  <p>Secondary color scale</p>
                  <div id="color-slider-primary"></div>
                  <arcgis-legend
                    id="legend-primary"
                    reference-element="scene-div"
                  ></arcgis-legend>
                  <div id="color-slider-secondary"></div>
                  <arcgis-legend
                    id="legend-secondary"
                    reference-element="scene-div"
                  ></arcgis-legend>
                </div>
              </calcite-tab>
              <ChartsDashboard></ChartsDashboard>

              <calcite-tab>
                <arcgis-layer-list
                  id="vis-layers"
                  reference-element="scene-div"
                ></arcgis-layer-list>
              </calcite-tab>
              <calcite-tab>
                <WeatherControls></WeatherControls>
              </calcite-tab>
            </calcite-tabs>
          </div>
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
    <calcite-tab>
      <calcite-accordion appearance="transparent" selection-mode="multiple">
        <calcite-accordion-item
          heading="Elevation profile"
          icon-start="altitude"
          expanded
        >
          <arcgis-elevation-profile
            label="test"
            reference-element="scene-div"
            hideClearButton={true}
            hideSelectButton={true}
            hideSettingsButton={true}
            hideSketchButton={true}
            highlightEnabled={false}
          ></arcgis-elevation-profile>
        </calcite-accordion-item>

        <calcite-accordion-item
          heading="Values over time"
          icon-start="graph-time-series"
        ></calcite-accordion-item>
        <calcite-accordion-item
          heading="Distribution of values"
          icon-start="graph-bar"
        ></calcite-accordion-item>
      </calcite-accordion>
    </calcite-tab>
  );
};

const VisDashboard = () => {
  return (
    <calcite-tab>
      <calcite-accordion appearance="transparent" selection-mode="multiple">
        <calcite-accordion-item
          icon-start="line"
          heading="Path setting"
          expanded
        >
          <calcite-accordion appearance="transparent" selection-mode="multiple">
            <calcite-accordion-item
              icon-start="view-visible"
              heading="Layer visibility"
            >
              <arcgis-layer-list
                id="vis-layers"
                reference-element="scene-div"
              ></arcgis-layer-list>
            </calcite-accordion-item>
            <calcite-accordion-item
              icon-start="multiple-variables"
              heading="Variable selection"
              expanded
            >
              {/* <calcite-label layout="inline">
                Primary visualization:
                <calcite-select id="primary-vis-select"></calcite-select>
              </calcite-label>
              <calcite-label layout="inline">
                Secondary visualization:
                <calcite-select id="secondary-vis-select"></calcite-select>
              </calcite-label> */}
            </calcite-accordion-item>
            <calcite-accordion-item icon-start="filter" heading="Filter">
              {/* <calcite-label layout="inline">
                Primary visualization:
                <div id="prim-filter-container"></div>
              </calcite-label>
              <calcite-label layout="inline">
                Secondary visualization:
                <div id="sec-filter-container"></div>
              </calcite-label> */}
            </calcite-accordion-item>
          </calcite-accordion>
        </calcite-accordion-item>
        <WeatherControls></WeatherControls>

        <calcite-accordion-item heading="Legend" icon-start="legend">
          <arcgis-legend reference-element="scene-div"></arcgis-legend>
        </calcite-accordion-item>
      </calcite-accordion>
    </calcite-tab>
  );
};

const WeatherControls = () => {
  return (
    <div>
      <div id="weather-container">
        <p>Size of tile (km)</p>
        <calcite-slider
          id="weather-size"
          value="20"
          max={50}
          min={0}
          label-handles="true"
          style="width:250px"
        ></calcite-slider>

        <p>Maximum distance from path (km)</p>
        <calcite-slider
          id="weather-distance"
          value="4"
          max={30}
          min={1}
          label-handles="true"
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
      <div id="weather-hidden">
        <div>
          <h3>Weather settings</h3>
          <calcite-label layout="inline">
            Variable:
            <calcite-select id="weather-select">
              <calcite-option value="Temperature">Temperature</calcite-option>
              <calcite-option value="Pressure">Pressure</calcite-option>
              <calcite-option value="Precipitation">
                Precipitation
              </calcite-option>
              <calcite-option value="Wind" selected>
                Wind
              </calcite-option>
            </calcite-select>
          </calcite-label>
          <calcite-label layout="inline">
            Snap to closest
            <calcite-switch id="weather-time-switch"></calcite-switch>
            Control time
          </calcite-label>
          <calcite-label layout="inline">
            <div id="weather-time-container"></div>
          </calcite-label>
        </div>
        <arcgis-legend
          id="weather-legend"
          reference-element="scene-div"
        ></arcgis-legend>
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

const Gauges = () => {
  return (
    <div id="gauges">
      <canvas id="gauge"></canvas>
      <canvas id="gauge2"></canvas>
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
      <arcgis-expand
        group="top-left"
        expand-icon="layer-map"
        collapse-icon="layer-map"
        expand-tooltip="Set thematic layers"
      >
        <arcgis-layer-list id="thematic-layers"></arcgis-layer-list>
        <arcgis-legend id="thematic-layers-legend"></arcgis-legend>
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
    <div id="time-controls">
      <calcite-label layout="inline" scale="s">
        Timezone:
        <calcite-input-time-zone
          mode="offset"
          offset-style="utc"
          id="timezone-picker"
          scale="s"
        ></calcite-input-time-zone>
      </calcite-label>
      <calcite-label layout="inline" scale="s">
        Time Window:
        <calcite-select id="time-window" scale="s">
          <calcite-option value={1}>1h</calcite-option>
          <calcite-option value={3}>3h</calcite-option>
          <calcite-option value={6}>6h</calcite-option>
          <calcite-option value={12}>12h</calcite-option>
          <calcite-option value={24} selected>
            24h
          </calcite-option>
        </calcite-select>
      </calcite-label>

      <calcite-label layout="inline" scale="s">
        Interval:
        <calcite-select id="stops" scale="s">
          <calcite-option value="continuous" selected>
            continuous
          </calcite-option>
          <calcite-option value="hours">hours</calcite-option>
          <calcite-option value="days">days</calcite-option>
        </calcite-select>
      </calcite-label>

      <calcite-label layout="inline" scale="s">
        Speed:
        <calcite-select id="speed" scale="s">
          <calcite-option value={1000}>slow</calcite-option>
          <calcite-option value={500} selected>
            normal
          </calcite-option>
          <calcite-option value={100}>fast</calcite-option>
        </calcite-select>
      </calcite-label>
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
