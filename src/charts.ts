import "@arcgis/charts-components/components/arcgis-chart";
import { defineCustomElements } from "@arcgis/charts-components/dist/loader";
import { createModel } from "@arcgis/charts-components/model";

// import { ArcgisTimeSlider } from "@arcgis/map-components/components/arcgis-time-slider";
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

  let elevProfile = document.querySelector("arcgis-elevation-profile");
  elevProfile.input = path;
  elevProfile.profiles = [
    {
      type: "input",
      color: "rgba(174, 216, 204, 1)",
      title: "Track elevation",
    },
    {
      type: "ground",
      color: "rgba(35, 57, 53, 1)",
      title: "Ground elevation",
      viewVisualizationEnabled: false,
    },
  ];

  const lineChartElement = document.getElementById("line-chart")!;
  const barChartElement = document.getElementById("bar-chart")!;

  // await setLineChart();
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
    lineChartModel.setConnectLines(true, 0);
    // lineChartModel.setSeriesMarkerSize(15, 0);
    lineChartModel.setSeriesName(primaryVisSelect.value, 0);
    lineChartModel.setSeriesColor([174, 216, 204, 255], 0);
    lineChartModel.setAreaColor([86, 104, 120, 255], 0);
    lineChartModel.setTitleText("");
    lineChartModel.setXAxisTitleText("Time");
    lineChartModel.setYAxisTitleText(
      primaryVisSelect.value.charAt(0).toUpperCase() +
        primaryVisSelect.value.slice(1),
    );
    lineChartModel.setBackgroundColor([255, 255, 255, 0]);
    lineChartElement.model = lineChartModel;
    lineChartElement.view = arcgisScene.view;
    lineChartElement.actionMode = "zoom";
    lineChartElement.layerFilterChangePolicy = "refresh";
    lineChartElement.viewTimeExtentChangePolicy = "refresh";
    lineChartElement.loaderColors = {
      curtainColor: [35, 57, 53, 100],
      spinnerColor: [174, 216, 204, 255],
    };

    let isMapSync = true;
    document.getElementById("chart-zoom").addEventListener("click", (event) => {
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
      });

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
  }

  // await setBarChart();
  async function setBarChart() {
    let variable = "altitude";
    let timeBinning = "esriTimeUnitsHours";

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
              family:
                "Avenir Next, Helvetica Neue, helvetica, arial, sans-serif",
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
    barChartElement.layer = secondaryLayer;
    barChartElement.model = configBarModel;
    barChartElement.view = arcgisScene.view;
    barChartElement.actionMode = "zoom";

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
  }
}
