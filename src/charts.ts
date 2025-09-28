import "@arcgis/charts-components/components/arcgis-chart";
import { defineCustomElements } from "@arcgis/charts-components/dist/loader";
import { createModel } from "@arcgis/charts-components/model";
import Legend from "@arcgis/core/widgets/Legend";
import { findLayersByTitles } from "./utils";
defineCustomElements(window, {
  resourcesUrl: "https://jsdev.arcgis.com/4.33/charts-components/",
});

declare global {
  interface Window {
    createModel: any;
  }

  const createModel: any;
}

export async function setCharts(path, arcgisScene, birdSummary) {
  const secondaryLayer = findLayersByTitles(
    arcgisScene.view,
    "Cylinder visualization",
  );

  const primaryVisSelect = document.getElementById(
    "primary-vis-select",
  ) as HTMLCalciteSelectElement;

  const lineChartElement = document.getElementById("line-chart")!;
  const legnedChartContainer = document.getElementById(
    "chart-secondary-legend",
  )!;

  let chartLegend = new Legend({
    view: arcgisScene.view,
    container: legnedChartContainer,
  });

  chartLegend.layerInfos = [
    {
      layer: secondaryLayer,
      title: "Chart color",
    },
  ];

  // checking if the line chart tab is open to know if to refresh the chart
  const dashboardTabsNav = document.getElementById("dashboard-tabs-nav")!;
  dashboardTabsNav?.addEventListener("calciteTabChange", async () => {
    if (dashboardTabsNav.selectedTitle.innerText.includes("Values")) {
      lineChartElement.layerFilterChangePolicy = "refresh";
    } else {
      lineChartElement.layerFilterChangePolicy = "ignore";
    }
  });

  setElevationProfile();

  await setLineChart();

  function setElevationProfile() {
    let elevProfile = document.querySelector("arcgis-elevation-profile");
    elevProfile.input = path;
    elevProfile.profiles = [
      {
        type: "ground",
        color: "rgba(35, 57, 53, 1)",
        title: "Ground elevation",
        viewVisualizationEnabled: false,
      },
      {
        type: "input",
        color: "rgba(174, 216, 204, 1)",
        title: "Track elevation",
      },
    ];
  }

  async function setLineChart() {
    const layerView = await arcgisScene.view.whenLayerView(secondaryLayer);
    const lineChartModel = await createModel({
      layer: secondaryLayer,
      chartType: "lineChart",
    });
    await lineChartModel.setXAxisField("timestamp");
    await lineChartModel.setNumericFields([primaryVisSelect.value]);
    await lineChartModel.setAggregationType("no_aggregation");
    lineChartModel.setTemporalBinningUnit("seconds");

    lineChartModel.setColorMatch(true);
    lineChartModel.setSeriesName(primaryVisSelect.value, 0);
    lineChartModel.setTitleText("");
    lineChartModel.setXAxisTitleText("Time");
    lineChartModel.setYAxisTitleText(
      primaryVisSelect.value.charAt(0).toUpperCase() +
        primaryVisSelect.value.slice(1),
    );
    lineChartModel.setBackgroundColor([255, 255, 255, 0]);
    lineChartModel.setTitleSymbol({
      type: "esriTS",
      color: [174, 216, 204, 255],
      font: { family: "Avenir Next", size: 14, weight: "bold" },
    });
    lineChartModel.setXAxisTitleSymbol({
      type: "esriTS",
      color: [174, 216, 204, 255],
      font: { size: 12 },
    });
    lineChartModel.setYAxisTitleSymbol({
      type: "esriTS",
      color: [174, 216, 204, 255],
      font: { size: 12 },
    });
    lineChartModel.setAxisLabelsSymbol({
      type: "esriTS",
      color: [174, 216, 204, 255],
      font: { size: 11 },
    });

    lineChartElement.style.height = "20rem";
    lineChartElement.model = lineChartModel;
    lineChartElement.view = arcgisScene.view;
    lineChartElement.actionMode = "zoom";
    lineChartElement.layerFilterChangePolicy = "refresh";
    lineChartElement.viewTimeExtentChangePolicy = "refresh";
    lineChartElement.loaderColors = {
      curtainColor: [35, 57, 53, 200],
      spinnerColor: [174, 216, 204, 255],
    };

    // setting cursor modes
    let isMapSync = true;
    document.getElementById("chart-zoom").addEventListener("click", (event) => {
      isMapSync = false;
      lineChartElement.actionMode = "zoom";
    });
    document
      .getElementById("chart-selection")
      .addEventListener("click", (event) => {
        isMapSync = false;
        lineChartElement.actionMode = "multiSelection";
      });
    document
      .getElementById("chart-selection-map")
      .addEventListener("click", (event) => {
        isMapSync = true;
        lineChartElement.actionMode = "multiSelection";
      });

    // implementing map sync with the chart
    lineChartElement.addEventListener("arcgisSelectionComplete", (event) => {
      arcgisScene.map.highlightSelect?.remove();
      const objectIDs = event.detail.selectionData.selectionOIDs;
      arcgisScene.map.highlightSelect = layerView.highlight(objectIDs);
      if (isMapSync) {
        // Query features based on the object ID array
        const query = layerView.layer.createQuery();
        query.objectIds = objectIDs;
        query.outFields = ["*"];
        query.returnGeometry = true;
        layerView.layer
          .queryFeatures(query)
          .then((results) => {
            if (results.features.length > 0) {
              arcgisScene.view.goTo(results.features);
            }
          })
          .catch((error) => {
            console.error("Error querying features: ", error);
          });
      }
    });
  }
}
