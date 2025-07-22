import { defineCustomElements } from "@arcgis/charts-components/dist/loader";
// import { createModel } from "@arcgis/charts-components/dist/model.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";

defineCustomElements(window, {
  resourcesUrl: "https://jsdev.arcgis.com/4.33/charts-components/",
});

declare global {
  interface Window {
    createModel: any;
  }

  const createModel: any;
}

export async function setCharts(
  path,
  secondaryLayer,
  arcgisScene,
  birdSummary,
) {
  const primaryVisSelect = document.getElementById(
    "primary-vis-select",
  ) as HTMLCalciteSelectElement;
  const secondaryVisSelect = document.getElementById(
    "secondary-vis-select",
  ) as HTMLCalciteSelectElement;

  let elevProfile = document.querySelector("arcgis-elevation-profile");

  elevProfile.input = path;
  elevProfile.profiles = [
    {
      type: "input",
      color: "#aed8cc",
      title: "Track elevation",
    },
    {
      type: "ground",
      color: "#233935",
      title: "Ground elevation",
      viewVisualizationEnabled: false,
    },
  ];

  const lineChartElement = document.getElementById("line-chart")!;
  const barChartElement = document.getElementById("bar-chart")!;
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  document
    .getElementById("set-bar-chart")
    ?.addEventListener("click", async () => {
      const layerView = await arcgisScene.view.whenLayerView(secondaryLayer);

      const visibleFeatures = await layerView.queryFeatures({
        timeExtent: timeSlider.timeExtent,
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

      barChartElement.layer = visibleFeatureLayer;
      barChartElement.model = configBarModel;
      barChartElement.view = arcgisScene.view;
      barChartElement.actionMode = "zoom";

      let timeBinning = "esriTimeUnitsDays";
      document
        .getElementById("chart-time-days")
        .addEventListener("click", (event) => {
          timeBinning = "esriTimeUnitsHours";
          barChartElement.model = configBarModel;
        });
      document
        .getElementById("chart-time-hours")
        .addEventListener("click", (event) => {
          timeBinning = "esriTimeUnitsHours";
          barChartElement.model = configBarModel;
        });
      document
        .getElementById("chart-time-minutes")
        .addEventListener("click", (event) => {
          timeBinning = "esriTimeUnitsMinutes";
          barChartElement.model = configBarModel;
        });
    });

  document
    .getElementById("set-line-chart")
    ?.addEventListener("click", async () => {
      const layerView = await arcgisScene.view.whenLayerView(secondaryLayer);

      const visibleFeatures = await layerView.queryFeatures({
        // geometry: arcgisScene.view.visibleArea,
        timeExtent: timeSlider.timeExtent,
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

      // lineChartElement.layer = visibleFeatureLayer;

      // // configModel.axes[0].maximum = minTime + visibleRange * 0.1; // zoom to 10%

      // lineChartElement.view = arcgisScene.view;
      // lineChartElement.model = configModel;
      // lineChartElement.actionMode = "multiSelection";
      // lineChartElement.usePopupTemplateFieldsInfo = true;
      // lineChartElement.ignoreSmoothRenderingLimit = true;
      // lineChartElement.viewTimeExtentChangePolicy = "refresh";
      // lineChartElement.loaderColors = {
      //   curtainColor: [35, 57, 53, 50],
      //   spinnerColor: [174, 216, 204, 100],
      // };
      // let zoomEnabled = false;

      // console.log("lineChartElement", lineChartElement);
      // console.log("lineChartElementOpt", lineChartElement.chartOptions);
      // console.log("lineChartElementV", lineChartElement.view);

      const lineChartModel = await createModel({
        layer: visibleFeatureLayer,
        chartType: "lineChart",
      });
      await lineChartModel.setXAxisField("timestamp");
      await lineChartModel.setNumericFields(["altitude"]);
      await lineChartModel.setAggregationType("no_aggregation");
      lineChartModel.setColorMatch(true);
      // set the series
      lineChartModel.setSeriesColor([34, 120, 181, 255], 0);
      lineChartModel.setConnectLines(false, 1);
      lineChartModel.setSeriesMarkerColor([15, 227, 73, 255], 1);
      lineChartModel.setSeriesMarkerSize(15, 1);
      lineChartModel.setSeriesMarkerStyle("esriSMSDiamond", 1);
      lineChartModel.setSeriesName("altitude", 0);
      // set area and color
      // lineChartModel.setAreaVisible(true, 0);
      lineChartModel.setAreaColor([86, 104, 120, 255], 0);
      // set guides
      // lineChartModel.addYAxisGuide("food break", 20);
      // lineChartModel.setGuideLabelText("🍽︎");
      // lineChartModel.setGuideStart(20);
      // lineChartModel.setGuideEnd(21);
      // lineChartModel.setGuideStyle("esriSFS");
      // set the chart title and axis titles
      // lineChartModel.setTitleText("Elevation Profile");
      lineChartModel.setXAxisTitleText("Time");
      lineChartModel.setYAxisTitleText("Altitude (m)");
      // set background color
      lineChartModel.setBackgroundColor([255, 255, 255, 0]);
      lineChartElement.model = lineChartModel;
      lineChartElement.view = arcgisScene.view;
      lineChartElement.actionMode = "zoom";
      // lineChartElement.layerFilterChangePolicy = "refresh";
      lineChartElement.viewTimeExtentChangePolicy = "refresh";
      lineChartElement.loaderColors = {
        curtainColor: [0, 0, 255, 50],
        spinnerColor: [255, 255, 255, 100],
      };

      primaryVisSelect?.addEventListener("calciteSelectChange", async () => {
        console.log("prim");

        const summary = birdSummary[primaryVisSelect.value];
        if (summary.type == "number") {
          await lineChartModel.setXAxisField(primaryVisSelect.value);
          lineChartElement.refresh();
          document.getElementById("line-chart")!.style.display = "block";
          document.getElementById("bar-chart")!.style.display = "none";
          document.getElementById("set-time-chart")!.style.display = "none";
          document.getElementById("chart-cursor-mode")!.style.display = "block";
        } else {
          document.getElementById("set-time-chart")!.style.display = "block";
          document.getElementById("chart-cursor-mode")!.style.display = "none";
        }
      });
      secondaryVisSelect?.addEventListener("calciteSelectChange", async () => {
        await lineChartModel.setXAxisField(secondaryVisSelect.value);
        lineChartElement.refresh();
      });

      let isMapSync = true;
      document
        .getElementById("chart-zoom")
        .addEventListener("click", (event) => {
          console.log("action", lineChartElement.actionMode);
          console.log("zoom");
          isMapSync = false;
          lineChartElement.actionMode = "zoom";
        });
      document
        .getElementById("chart-selection")
        .addEventListener("click", (event) => {
          console.log("select");
          isMapSync = false;
          lineChartElement.actionMode = "multiSelection";
        });
      document
        .getElementById("chart-selection-map")
        .addEventListener("click", (event) => {
          console.log("map");
          isMapSync = true;
          lineChartElement.actionMode = "multiSelection";
          // lineChartElement.actionMode = "monoSelection";
        });
      // actionBarElement.addEventListener("arcgisDefaultActionSelect", (event) => {
      //   const { actionId, actionActive } = event.detail;
      //   if (actionId === "filterByExtent") {
      //     lineChartElement.filterByExtent = actionActive;
      //   }
      // });

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
      // highlight chart based on map
      arcgisScene.addEventListener("arcgisViewClick", (event) => {
        const { hit } = event.target;
        console.log("hit", hit);
        let screenPoints = event.detail.screenPoint;
        event.target.hitTest(screenPoints).then(getFeatures);
      });

      function getFeatures(response) {
        console.log("response", response);
        if (response.results.length) {
          const selectedFeatureOID =
            response.results[0].graphic.attributes["ObjectID"];
          lineChartElement.selectionData = {
            selectionOIDs: [selectedFeatureOID],
          };
        }
      }
    });

  let variable = "altitude";
  let timeBinning = "esriTimeUnitsDays";
  // let variable = "flight_behavior";
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
              size: 10,
            },
            horizontalAlignment: "center",
          },
        },
        guides: [
          {
            type: "chartGuide",
            name: "General path statistics",
            start: "2200",
            style: {
              type: "esriSLS",
              width: 5,
              color: [174, 216, 204, 50],
            },
            label: {
              type: "esriTS",
              color: [174, 216, 204, 50],
              text: "Mean: 2200",
              font: {
                size: 16,
              },
            },
          },
          {
            type: "chartGuide",
            name: "General path statistics",
            start: "67",
            style: {
              type: "esriSLS",
              width: 5,
              color: [174, 216, 204, 50],
            },
            label: {
              type: "esriTS",
              color: [174, 216, 204, 50],
              text: "Min: 67",
              font: {
                size: 16,
              },
            },
          },
          {
            type: "chartGuide",
            name: "General path statistics",
            start: "3370",
            style: {
              type: "esriSLS",
              width: 5,
              color: [174, 216, 204, 50],
            },
            label: {
              type: "esriTS",
              color: [174, 216, 204, 50],
              text: "Max: 3370",
              font: {
                size: 16,
              },
            },
          },
        ],
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
        y: variable,
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
            family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
          size: 12,
        },
        horizontalAlignment: "center",
      },
      position: "bottom",
      maxHeight: null,
    },
  };

  let configBarModel = {
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
        text: "BirdID over time",
        font: {
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
            text: "Count of Bird ID",
            font: {
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
            text: "Count of Bird ID",
            font: {
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
        type: "barSeries",
        id: "linear_soaring",
        name: "linear_soaring",
        query: {
          groupByFieldsForStatistics: ["timestamp"],
          where: "flight_behavior='linear_soaring'",

          outStatistics: [
            {
              statisticType: "count",
              onStatisticField: variable,
              outStatisticFieldName: "COUNT_FIELD_1",
            },
          ],
          orderByFields: ["timestamp ASC"],
        },
        x: "timestamp",
        y: "COUNT_FIELD_1",
        // fillSymbol: {
        //   type: "esriSFS",
        //   style: "esriSFSSolid",
        //   color: [255, 0, 0, 178.5],
        // },
        dataLabels: {
          type: "chartText",
          visible: false,
          content: {
            type: "esriTS",
            color: [174, 216, 204, 178.5],
            text: "",
            font: {
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
              size: 10,
            },
            horizontalAlignment: "center",
          },
        },
        timeIntervalSize: 1,
        timeIntervalUnits: timeBinning,
        timeAggregationType: "equalIntervalsFromStartTime",
        trimIncompleteTimeInterval: true,
        nullPolicy: "interpolate",
        rotated: false,
      },
      {
        type: "barSeries",
        id: "gliding",
        name: "gliding",
        query: {
          groupByFieldsForStatistics: ["timestamp"],
          where: "flight_behavior='gliding'",

          outStatistics: [
            {
              statisticType: "count",
              onStatisticField: variable,
              outStatisticFieldName: "COUNT_FIELD_2",
            },
          ],
          orderByFields: ["timestamp ASC"],
        },
        x: "timestamp",
        y: "COUNT_FIELD_2",
        // fillSymbol: {
        //   type: "esriSFS",
        //   style: "esriSFSSolid",
        //   color: [0, 255, 0, 178.5],
        // },
        dataLabels: {
          type: "chartText",
          visible: false,
          content: {
            type: "esriTS",
            color: [174, 216, 204, 178.5],
            text: "",
            font: {
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
              size: 10,
            },
            horizontalAlignment: "center",
          },
        },
        timeIntervalSize: 1,
        timeIntervalUnits: "esriTimeUnitsHours",
        timeAggregationType: "equalIntervalsFromStartTime",
        trimIncompleteTimeInterval: true,
        nullPolicy: "interpolate",
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
            family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
          family: "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
          size: 12,
        },
        horizontalAlignment: "center",
      },
      position: "bottom",
      maxHeight: null,
    },
    // chartRenderer: {
    //   type: "uniqueValue",
    //   field1: "birdid",
    //   uniqueValueInfos: [
    //     {
    //       label: "D329_015",
    //       symbol: {
    //         type: "esriSMS",
    //         color: [180, 192, 12, 186],
    //         style: "esriSMSCircle",
    //         outline: {
    //           type: "esriSLS",
    //           color: [180, 192, 12, 255],
    //         },
    //       },
    //       value: "D329_015",
    //     },
    //     {
    //       label: "D329_016",
    //       symbol: {
    //         type: "esriSMS",
    //         color: [104, 137, 157, 129],
    //         style: "esriSMSCircle",
    //         outline: {
    //           type: "esriSLS",
    //           color: [104, 137, 157, 255],
    //         },
    //       },
    //       value: "D329_016",
    //     },
    //   ],
    // },
  };
}
