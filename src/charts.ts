import { defineCustomElements } from "@arcgis/charts-components/dist/loader";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

defineCustomElements(window, {
  resourcesUrl: "https://js.arcgis.com/charts-components/4.32/assets",
});

export async function setCharts(path, secondaryLayer, arcgisScene) {
  let elevProfile = document.querySelector("arcgis-elevation-profile");

  elevProfile.input = path;
  elevProfile.profiles = [
    {
      type: "input",
      color: "#aed8cc",
      title: "Line elevation",
    },
    {
      type: "ground",
      color: "#233935",
      title: "Ground elevation",
      viewVisualizationEnabled: false,
    },
  ];

  // const actionBarElement = document.querySelector("arcgis-charts-action-bar");
  // actionBarElement.hiddenActions = [
  //   "legend",
  //   "rotateChart",
  //   "editChart",
  //   "fullExtent",
  //   "switchSelection",
  // ];
  const lineChartElement = document.getElementById("chart")!;
  // Wait for layer view and query visible features

  document.getElementById("set-chart")?.addEventListener("click", async () => {
    const layerView = await arcgisScene.view.whenLayerView(secondaryLayer);

    const visibleFeatures = await layerView.queryFeatures({
      geometry: arcgisScene.view.extent,
      returnGeometry: true,
      outFields: ["*"],
    });

    console.log("vf", visibleFeatures.features.length);

    const allFields = secondaryLayer.fields.map((field) => ({
      name: field.name,
      alias: field.alias ?? field.name,
      type: field.type,
    }));

    const visibleFeatureLayer = new FeatureLayer({
      source: visibleFeatures.features,
      objectIdField: "ObjectID",
      geometryType: secondaryLayer.geometryType,
      spatialReference: secondaryLayer.spatialReference,
      fields: allFields,
      renderer: secondaryLayer.renderer,
      popupTemplate: secondaryLayer.popupTemplate,
    });

    lineChartElement.layer = layerView;

    // configModel.axes[0].maximum = minTime + visibleRange * 0.1; // zoom to 10%

    lineChartElement.model = configModel;

    lineChartElement.view = arcgisScene.view;

    let zoomEnabled = false;

    console.log("lineChartElement", lineChartElement);
    console.log("lineChartElementOpt", lineChartElement.chartOptions);
    console.log("lineChartElementV", lineChartElement.view);

    // document.getElementById("zoom-chart").addEventListener("click", () => {
    //   // Wait until chartView is available

    //   zoomEnabled = !zoomEnabled;
    //   lineChartElement.view.cursor = "zoom";

    //   // Optional: Change button style or label
    //   document.getElementById("zoom-chart").textContent = zoomEnabled
    //     ? "Zoom: ON"
    //     : "Zoom: OFF";
    // });

    // document
    //   .getElementById("zoom-chart")
    //   ?.addEventListener("click", async () => {
    //     lineChartElement.chartOptions.mode = "zoom";

    //   });
    // document
    //   .getElementById("select-chart")
    //   ?.addEventListener("click", async () => {
    //     lineChartElement.chartOptions.mode = "selection";
    //   });

    lineChartElement.addEventListener("arcgisSelectionComplete", (event) => {
      arcgisScene.map.highlightSelect?.remove();
      arcgisScene.map.highlightSelect = layerView.highlight(
        event.detail.selectionData.selectionOIDs,
      );
    });
    // highlight chart based on map
    arcgisScene.addEventListener("arcgisViewClick", (event) => {
      const { hit } = event.target;
      console.log("hit", hit);
      let screenPoints = event.detail.screenPoint;
      event.target.hitTest(screenPoints).then(getFeatures);
    });

    function getFeatures(response) {
      console.log("response", response);
      const selectedFeatureOID =
        response.results[0].graphic.attributes["ObjectID"];
      lineChartElement.selectionData = {
        selectionOIDs: [selectedFeatureOID],
      };
    }
  });
}

let configModel = {
  version: "18.1.0",
  type: "chart",
  id: "Chart 1748946980478",
  colorMatch: true,
  rotated: false,
  orderOptions: {
    data: {
      orderType: "arcgis-charts-category",
      orderBy: "ASC",
    },
  },
  title: {
    type: "chartText",
    visible: true,
    content: {
      type: "esriTS",
      color: [174, 216, 204, 255],
      text: "Altitude over time",
      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 18,
      },
      horizontalAlignment: "center",
    },
  },
  subTitle: {
    type: "chartText",
    visible: true,
    content: {
      type: "esriTS",
      color: [0, 0, 0, 178.5],
      text: "",
      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 10,
      },
      horizontalAlignment: "center",
    },
  },
  footer: {
    type: "chartText",
    visible: true,
    content: {
      type: "esriTS",
      color: [0, 0, 0, 178.5],
      text: "",
      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 11,
      },
      horizontalAlignment: "center",
    },
  },
  background: [100, 100, 100, 0],
  axes: [
    {
      type: "chartAxis",
      visible: true,
      scrollbarVisible: true,
      title: {
        type: "chartText",
        visible: true,
        content: {
          type: "esriTS",
          color: [174, 216, 204, 255],
          text: "Time",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 14,
          },
          horizontalAlignment: "center",
          verticalAlignment: "middle",
        },
      },
      labels: {
        type: "chartText",
        visible: true,
        content: {
          type: "esriTS",
          color: [174, 216, 204, 255],
          text: "Time",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 10,
          },
          horizontalAlignment: "center",
        },
      },
      valueFormat: {
        type: "date",
        intlOptions: {
          dateStyle: "short",
          timeStyle: "short",
        },
      },
      lineSymbol: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: [174, 216, 204, 255],
        width: 1,
      },
      integerOnlyValues: false,
    },
    {
      type: "chartAxis",
      visible: true,
      scrollbarVisible: true,
      title: {
        type: "chartText",
        visible: true,
        content: {
          type: "esriTS",
          color: [174, 216, 204, 255],
          text: "Altitude",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 14,
          },
          horizontalAlignment: "center",
          verticalAlignment: "middle",
        },
      },
      labels: {
        type: "chartText",
        visible: true,
        content: {
          type: "esriTS",
          color: [174, 216, 204, 255],
          text: "Count",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 10,
          },
          horizontalAlignment: "center",
        },
      },
      valueFormat: {
        type: "number",
        intlOptions: {
          style: "decimal",
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
          useGrouping: true,
        },
      },
      lineSymbol: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: [174, 216, 204, 255],
        width: 1,
      },
      grid: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: [0, 0, 0, 25],
        width: 1,
      },
      minimum: null,
      maximum: null,
      integerOnlyValues: false,
    },
  ],
  series: [
    {
      type: "lineSeries",
      id: "altitude",
      name: "Altitude",
      showArea: false,
      query: {
        groupByFieldsForStatistics: ["timestamp"],
      },
      x: "timestamp",
      y: "altitude",
      lineSymbol: {
        type: "esriSLS",
        style: "esriSLSSolid",
        color: [174, 216, 204, 100],
        width: 1,
      },
      markerSymbol: {
        type: "esriSMS",
        style: "esriSMSCircle",
        color: [174, 216, 204, 178.5],
        size: 3,
      },
      dataLabels: {
        type: "chartText",
        visible: false,
        content: {
          type: "esriTS",
          color: [174, 216, 204, 178.5],
          text: "",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 10,
          },
          horizontalAlignment: "center",
        },
      },
      // timeIntervalSize: 1,
      // timeIntervalUnits: "esriTimeUnitsMinutes",
      // timeAggregationType: "equalIntervalsFromStartTime",
      // trimIncompleteTimeInterval: true,
      // nullPolicy: "interpolate",
      rotated: false,
    },
  ],
  legend: {
    type: "chartLegend",
    visible: true,
    title: {
      type: "chartText",
      visible: true,
      content: {
        type: "esriTS",
        color: [0, 0, 0, 178.5],
        text: "Altitude",
        font: {
          family: "Arial, Helvetica, sans-serif",
          size: 13,
        },
        horizontalAlignment: "center",
      },
    },
    body: {
      type: "esriTS",
      color: [174, 216, 204, 255],
      text: "",
      font: {
        family: "Arial, Helvetica, sans-serif",
        size: 12,
      },
      horizontalAlignment: "center",
    },
    position: "bottom",
    maxHeight: null,
  },
};
