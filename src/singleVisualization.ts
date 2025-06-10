import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";

import Color from "@arcgis/core/Color";
import histogram from "@arcgis/core/smartMapping/statistics/histogram";
import * as colorSymbology from "@arcgis/core/smartMapping/symbology/color";
import { TextSymbol } from "@arcgis/core/symbols";
import ColorSlider from "@arcgis/core/widgets/smartMapping/ColorSlider";

import { createDynamicPopupTemplate } from "./layers";

import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color.js";
export function setSingleVis(
  arcgisScene: HTMLArcgisSceneElement,
  primaryLayer: __esri.FeatureLayer,
  secondaryLayer: __esri.FeatureLayer,
  arrowLayer: __esri.GraphicsLayer,
  birdSummary: Record<string, any>,
  primaryValue: string,
  secondaryValue: string,
) {
  const primaryVisSelect = document.getElementById(
    "primary-vis-select",
  ) as HTMLCalciteSelectElement;
  const secondaryVisSelect = document.getElementById(
    "secondary-vis-select",
  ) as HTMLCalciteSelectElement;

  const primaryLegend = document.getElementById("legend-primary");
  const secondaryLegend = document.getElementById("legend-secondary");
  const primaryColorScale = document.getElementById("color-slider-primary");
  const secondaryColorScale = document.getElementById("color-slider-secondary");

  createAttributeSelects(birdSummary, primaryVisSelect, primaryValue);
  createAttributeSelects(birdSummary, secondaryVisSelect, secondaryValue);
  createDynamicPopupTemplate(primaryLayer, primaryValue, birdSummary);
  createDynamicPopupTemplate(secondaryLayer, secondaryValue, birdSummary);

  createFilters(
    arcgisScene,
    primaryLayer,
    birdSummary,
    document.getElementById("prim-filter-container")!,
    primaryValue,
  );
  createFilters(
    arcgisScene,
    secondaryLayer,
    birdSummary,
    document.getElementById("sec-filter-container")!,
    secondaryValue,
  );

  updateArrowLayer(arrowLayer, primaryValue, birdSummary);
  updateLayerColorVariables(primaryValue, primaryLayer, birdSummary);
  updateLayerColorVariables(secondaryValue, secondaryLayer, birdSummary);

  primaryLegend.layerInfos = [
    {
      layer: primaryLayer,
    },
  ];

  secondaryLegend.layerInfos = [
    {
      layer: secondaryLayer,
    },
  ];
  createColorSlider(primaryVisSelect.value, primaryLayer, "primary");
  createColorSlider(secondaryVisSelect.value, secondaryLayer, "secondary");
  primaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    arcgisScene.view.whenLayerView(primaryLayer).then((layerView) => {
      layerView.filter = null;
    });
    updateLayerColorVariables(
      primaryVisSelect.value,
      primaryLayer,
      birdSummary,
    );
    createColorSlider(primaryVisSelect.value, primaryLayer, "primary");
    createFilters(
      arcgisScene,
      primaryLayer,
      birdSummary,
      document.getElementById("prim-filter-container"),
      primaryVisSelect.value,
    );
    updateArrowLayer(arrowLayer, primaryVisSelect.value, birdSummary);
    createDynamicPopupTemplate(
      primaryLayer,
      primaryVisSelect.value,
      birdSummary,
    );
  });

  secondaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    arcgisScene.view.whenLayerView(secondaryLayer).then((layerView) => {
      layerView.filter = null;
    });
    updateLayerColorVariables(
      secondaryVisSelect.value,
      secondaryLayer,
      birdSummary,
    );
    createColorSlider(secondaryVisSelect.value, secondaryLayer, "secondary");

    createFilters(
      arcgisScene,
      secondaryLayer,
      birdSummary,
      document.getElementById("sec-filter-container"),
      secondaryVisSelect.value,
    );

    createDynamicPopupTemplate(
      secondaryLayer,
      secondaryVisSelect.value,
      birdSummary,
    );
  });

  function createAttributeSelects(
    birdSummary: Record<string, any>,
    select: HTMLCalciteSelectElement,
    defaultValue: string,
  ) {
    select.innerHTML = "";
    const attributes = Object.keys(birdSummary);

    // if (!attributes.includes("---single color---")) {
    //   attributes.unshift("---single color---");
    // }

    attributes.forEach((attribute) => {
      const option = document.createElement("calcite-option");
      option.value = option.label = option.textContent = attribute;
      select.appendChild(option);
    });
    select.value = defaultValue;
  }

  function createColorSlider(variable, layer: __esri.FeatureLayer, layerType) {
    const summary = birdSummary[variable];
    const currentRenderer = layer.renderer.clone();
    let container;
    let colorScaleContainer;
    let legendContainer;
    if (layerType == "primary") {
      container = "color-slider-primary";
      colorScaleContainer = primaryColorScale;
      legendContainer = primaryLegend;
    } else {
      container = "color-slider-secondary";
      colorScaleContainer = secondaryColorScale;
      legendContainer = secondaryLegend;
    }

    if (!summary || variable === "---single color---") {
      legendContainer!.style.display = "block";
      colorScaleContainer!.style.display = "none";
      return;
    } else if (summary.type === "number") {
      colorScaleContainer.innerHTML = null;
      legendContainer!.style.display = "none";
      colorScaleContainer!.style.display = "block";
    } else {
      legendContainer!.style.display = "block";
      colorScaleContainer!.style.display = "none";
      return;
    }

    const redAndGreenScheme = colorSymbology.getSchemeByName({
      basemap: arcgisScene.map.basemap,
      geometryType: "polygon",
      theme: "above-and-below",
      name: "Red and Green 4",
    });

    // flip the red and green scheme so green is on top
    // const myScheme = colorSymbology.flipColors(redAndGreenScheme);

    const colorParams = {
      layer: layer,
      view: arcgisScene.view,
      field: variable,
      theme: "high-to-low",
      colorScheme: redAndGreenScheme,
      // edgesType: "solid",
    };

    const bars = [];
    let rendererResultOrg = null;
    let rendererResult = null;

    let vv = null;

    colorRendererCreator
      .createContinuousRenderer(colorParams)
      .then((response) => {
        rendererResult = response;
        let customSymbol = null;
        let type = currentRenderer.symbol.type;
        if (type === "point-3d") {
          customSymbol = {
            type: "point-3d",
            symbolLayers: [
              {
                type: "object",
                resource: {
                  primitive: "cylinder",
                },
                material: { color: [255, 0, 0] },
                width: 10,
                height: 3000,
                tilt: 180,
              },
            ],
          };
        } else if (type === "line-3d") {
          customSymbol = {
            type: "line-3d",
            symbolLayers: [
              {
                type: "line",
                size: 6,
                cap: "round",
                material: { color: [255, 0, 0] },
              },
            ],
          };
        }

        vv = rendererResult.visualVariable;
        rendererResult.renderer.classBreakInfos?.forEach((info) => {
          info.symbol = customSymbol;
        });
        layer.renderer = response.renderer;

        return histogram({
          layer: colorParams.layer,
          field: colorParams.field,
          numBins: 60,
        });
      })
      .then((histogramResult) => {
        const slider = ColorSlider.fromRendererResult(
          rendererResult,
          histogramResult,
        );

        slider.set({
          primaryHandleEnabled: true,
          container: container,
          handlesSyncedToPrimary: false,
          syncedSegmentsEnabled: true,
          labelFormatFunction: (value) => {
            return value.toFixed(0);
          },
        });
        // update the slider bars to match renderer values
        slider.histogramConfig.barCreatedFunction = (index, element) => {
          const bin = histogramResult.bins[index];
          const midValue = (bin.maxValue - bin.minValue) / 2 + bin.minValue;
          const color = getColorFromValue(vv.stops, midValue);
          element.setAttribute("fill", color.toHex());
          bars.push(element);
        };

        slider.on(
          [
            "thumb-change",
            "thumb-drag",
            "min-change",
            "max-change",
            "segment-drag",
          ],
          () => {
            const renderer = layer.renderer.clone();
            const colorVariable = renderer.visualVariables[0].clone();
            colorVariable.stops = slider.stops;
            renderer.visualVariables = [colorVariable];
            layer.renderer = renderer;

            // not redrawing otheriwse
            layer.visible = false;
            requestAnimationFrame(() => {
              layer.visible = true;
            });
            // update the color of each histogram bar based on the
            // values of the slider thumbs
            bars.forEach((bar, index) => {
              const bin = slider.histogramConfig.bins[index];
              const midValue = (bin.maxValue - bin.minValue) / 2 + bin.minValue;
              const color = getColorFromValue(slider.stops, midValue);
              bar.setAttribute("fill", color.toHex());
            });
          },
        );
      })
      .catch((error) => {
        console.log("Color slider error: ", error);
      });

    // infers the color for a given value
    // based on the stops from a ColorVariable
    function getColorFromValue(stops, value) {
      let minStop = stops[0];
      let maxStop = stops[stops.length - 1];

      const minStopValue = minStop.value;
      const maxStopValue = maxStop.value;

      if (value < minStopValue) {
        return minStop.color;
      }

      if (value > maxStopValue) {
        return maxStop.color;
      }

      const exactMatches = stops.filter((stop) => {
        return stop.value === value;
      });

      if (exactMatches.length > 0) {
        return exactMatches[0].color;
      }

      minStop = null;
      maxStop = null;
      stops.forEach((stop, i) => {
        if (!minStop && !maxStop && stop.value >= value) {
          minStop = stops[i - 1];
          maxStop = stop;
        }
      });

      const weightedPosition =
        (value - minStop.value) / (maxStop.value - minStop.value);

      return Color.blendColors(minStop.color, maxStop.color, weightedPosition);
    }
  }
}

//src: chatGPT based on given requirements
export function summarizeData(birdData: any[]) {
  const summary: Record<
    string,
    | {
        type: "number";
        min: number;
        max: number;
        mean: number;
        minLocation: { longitude: number; latitude: number; z: number };
        maxLocation: { longitude: number; latitude: number; z: number };
      }
    | { type: "other"; values: any[] }
  > = {};

  function getFirstValidValue(data: any[], key: string): any {
    return data.find((entry) => {
      const value = entry[key];
      return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !(typeof value === "number" && isNaN(value))
      );
    })?.[key];
  }

  for (const key of Object.keys(birdData[0])) {
    if (key === "timestamp") continue;

    const firstValue = getFirstValidValue(birdData, key);

    if (firstValue === undefined) continue; // skip if no valid value at all

    if (typeof firstValue === "number") {
      let min = Infinity;
      let max = -Infinity;
      let count = 0;
      let sum = 0;
      let minLocation = { longitude: NaN, latitude: NaN, z: NaN };
      let maxLocation = { longitude: NaN, latitude: NaN, z: NaN };
      for (const entry of birdData) {
        const value = entry[key];
        if (typeof value === "number" && !isNaN(value)) {
          sum += value;
          count++;
          if (value < min) {
            min = value;
            minLocation = {
              longitude: entry.longitude ?? NaN,
              latitude: entry.latitude ?? NaN,
              z: entry.altitude ?? NaN,
            };
          }
          if (value > max) {
            max = value;
            maxLocation = {
              longitude: entry.longitude ?? NaN,
              latitude: entry.latitude ?? NaN,
              z: entry.altitude ?? NaN,
            };
          }
        }
      }
      if (min === max) {
        summary[key] = {
          type: "other",
          values: [min.toString()],
        };
      } else {
        summary[key] = {
          type: "number",
          min,
          max,
          mean: count > 0 ? parseFloat((sum / count).toFixed(2)) : min,
          minLocation,
          maxLocation,
        };
      }
    } else {
      const values = Array.from(
        new Set(
          birdData
            .map((item) => item[key])
            .filter((val) => val !== null && val !== undefined && val !== ""),
        ),
      );
      summary[key] = { type: "other", values: [...new Set(values)] };
    }
  }

  console.log("Summary output:", summary);
  return summary;
}

export function generateLayerFields(birdSummary: any) {
  const fields = [
    { name: "ObjectID", type: "oid" },
    { name: "birdid", type: "string" },
    { name: "longitude", type: "double" },
    { name: "latitude", type: "double" },
    { name: "timestamp", type: "date" },
    { name: "altitude", type: "double" },
    { name: "speed", type: "double" },
    { name: "heading", type: "double" },
    { name: "roll", type: "double" },
  ];

  const specialKeys = new Set(fields.map((f) => f.name));

  for (const key in birdSummary) {
    if (!specialKeys.has(key)) {
      const attr = birdSummary[key];
      fields.push({
        name: key,
        type: attr.type === "number" ? "double" : "string",
      });
    }
  }

  return fields;
}

export function createFilters(
  arcgisScene: HTMLArcgisSceneElement,
  layer: __esri.FeatureLayer,
  birdSummary: Record<string, any>,
  container: HTMLElement,
  variable: string,
) {
  container.innerHTML = "";
  const summary = birdSummary[variable];
  if (summary) {
    if (summary.type == "number") {
      const slider = document.createElement("calcite-slider");
      slider.minValue = summary.min;
      slider.maxValue = summary.max;
      slider.min = summary.min;
      slider.max = summary.max;
      // slider.style = "width:250px";
      slider.setAttribute("label-handles", "");
      slider.addEventListener("calciteSliderChange", async () => {
        const minValue = slider.minValue;
        const maxValue = slider.maxValue;

        arcgisScene.view.whenLayerView(layer).then((layerView) => {
          layerView.filter = {
            where: `${variable} >= ${minValue} AND ${variable} <= ${maxValue}`,
          };
        });
      });
      container.appendChild(slider);
    } else {
      const combobox = document.createElement("calcite-combobox");
      combobox.setAttribute("selection-display", "fit");
      combobox.setAttribute("overlay-positioning", "fix");

      let categories = summary.values;
      categories.forEach((category) => {
        const option = document.createElement("calcite-combobox-item");
        option.value = option.heading = category;
        combobox.appendChild(option);
      });
      combobox.addEventListener("calciteComboboxChange", async () => {
        const selected = Array.isArray(combobox.value)
          ? combobox.value
          : [combobox.value];

        arcgisScene.view.whenLayerView(layer).then((layerView) => {
          if (
            selected.length === 0 ||
            (selected.length === 1 && selected[0] === "")
          ) {
            layerView.filter = null;
          } else {
            layerView.filter = {
              where: `${variable} IN (${selected.map((v) => `'${v}'`).join(", ")})`,
            };
          }
        });
      });
      container.appendChild(combobox);
    }
  }
}

export function updateArrowLayer(
  arrowLayer: __esri.GraphicsLayer,
  variable: string,
  birdSummary: any,
) {
  arrowLayer.removeAll();
  const summary = birdSummary[variable];
  if (!summary || summary.type !== "number") return null;

  const arrows = [
    {
      location: summary.minLocation,
      icon: "\ue608", // Down arrow
      label: summary.min.toFixed(0),
      color: [255, 0, 0],
    },
    {
      location: summary.maxLocation,
      icon: "\ue609", // Up arrow
      label: summary.max.toFixed(0),
    },
  ];

  const graphics = arrows.map(({ location, icon, label }) => {
    const point = new Point({
      longitude: location.longitude,
      latitude: location.latitude,
      z: (location.z || 0) + 15,
      spatialReference: { wkid: 4326 },
    });

    return new Graphic({
      geometry: point,
      symbol: new TextSymbol({
        text: `${label}\n${icon}`,
        color: [14, 22, 21],
        haloColor: [125, 149, 139, 0.5],
        haloSize: 2,
        font: {
          size: 24,
          family: "CalciteWebCoreIcons",
          weight: "bold",
        },
        verticalAlignment: "middle",
      }),
    });
  });

  arrowLayer.addMany(graphics);
}

export function updateLayerColorVariables(variable, layer, birdSummary) {
  const summary = birdSummary[variable];
  const currentRenderer = layer.renderer.clone();
  if (!summary || variable === "---single color---") {
    // currentRenderer.visualVariables = [];
    // currentRenderer.uniqueValueInfos = [];
    // currentRenderer.type = "simple";
    // layer.renderer = currentRenderer;
    layer.renderer = createSimpleRenderer(variable, summary, currentRenderer);
    return;
  }

  if (summary.type === "other") {
    layer.renderer = createUniqueValueRenderer(
      variable,
      summary.values,
      currentRenderer,
    );
  } else {
    layer.renderer = createVisualVariablesRenderer(
      variable,
      summary,
      currentRenderer,
    );
  }
}

function createUniqueValueRenderer(variable, uniqueValues, currentRenderer) {
  let symbol;
  let type;
  if (currentRenderer.type === "unique-value") {
    type = currentRenderer.uniqueValueInfos[0].symbol.type;
  } else if (currentRenderer.type === "class-breaks") {
    type = currentRenderer.classBreakInfos?.[0]?.symbol?.type;
  } else {
    type = currentRenderer.symbol.type;
  }
  // currentRenderer.symbol;

  const uniqueValueInfos = uniqueValues.map((val, i) => {
    if (type === "point-3d") {
      symbol = {
        type: "point-3d",
        symbolLayers: [
          {
            type: "object",
            resource: {
              primitive: "cylinder",
            },
            material: { color: getCategoricalColor(i) },
            width: 10,
            height: 3000,
            tilt: 180,
          },
        ],
      };
    } else if (type === "line-3d") {
      symbol = {
        type: "line-3d",
        symbolLayers: [
          {
            type: "line",
            size: 6,
            cap: "round",
            material: { color: getCategoricalColor(i) },
          },
        ],
      };
    }

    return {
      value: val,
      symbol: symbol,
    };
  });

  return {
    type: "unique-value",
    field: variable,
    uniqueValueInfos,
  };
}

function createVisualVariablesRenderer(variable, summary, currentRenderer) {
  let symbol;
  let type;
  console.log("type", currentRenderer.type);
  if (currentRenderer.type === "unique-value") {
    type = currentRenderer.uniqueValueInfos[0].symbol.type;
  } else if (currentRenderer.type === "class-breaks") {
    type = currentRenderer.classBreakInfos?.[0]?.symbol?.type;
  } else {
    type = currentRenderer.symbol.type;
  }

  // currentRenderer.symbol;
  const { min, max } = summary;

  const step = (max - min) / 4;
  const stops = Array.from({ length: 5 }, (_, i) => ({
    value: +(min + i * step).toFixed(2),
    color: getContinuousColor(i),
  }));
  let visualVariables = [
    {
      type: "color",
      field: variable,
      stops,
    },
  ];

  if (type === "point-3d") {
    symbol = {
      type: "point-3d",
      symbolLayers: [
        {
          type: "object",
          resource: {
            primitive: "cylinder",
          },
          material: { color: [255, 0, 0] },
          width: 10,
          height: 3000,
          tilt: 180,
        },
      ],
    };
  } else if (type === "line-3d") {
    symbol = {
      type: "line-3d",
      symbolLayers: [
        {
          type: "line",
          size: 6,
          cap: "round",
          material: { color: [255, 0, 0] },
        },
      ],
    };
  }
  return {
    type: "simple",
    symbol,
    visualVariables,
  };
}

function createSimpleRenderer(variable, summary, currentRenderer) {
  let symbol;
  let type;
  if (currentRenderer.type === "unique-value") {
    type = currentRenderer.uniqueValueInfos[0].symbol.type;
  } else if (currentRenderer.type === "class-breaks") {
    type = currentRenderer.classBreakInfos?.[0]?.symbol?.type;
  } else {
    type = currentRenderer.symbol.type;
  }
  // currentRenderer.symbol;

  if (type === "point-3d") {
    symbol = {
      type: "point-3d",
      symbolLayers: [
        {
          type: "object",
          resource: {
            primitive: "cylinder",
          },
          material: { color: [255, 0, 0] },
          width: 10,
          height: 3000,
          tilt: 180,
        },
      ],
    };
  } else if (type === "line-3d") {
    symbol = {
      type: "line-3d",
      symbolLayers: [
        {
          type: "line",
          size: 6,
          cap: "round",
          material: { color: [255, 0, 0] },
        },
      ],
    };
  }
  return {
    type: "simple",
    symbol,
  };
}

function getContinuousColor(index) {
  // https://tristen.ca/hcl-picker/#/hlc/5/1.03/2A1620/EEEE65
  const colors = ["#2A1620", "#3E485F", "#248689", "#64C281", "#EEEE65"];

  // Esri color ramps - Viridis
  // const colors = [
  //   "rgba(96, 88, 190, 0.7)",
  //   "rgba(65, 158, 203, 0.7)",
  //   "rgba(44, 220, 198, 0.7)",
  //   "rgba(111, 255, 153, 0.7)",
  //   "rgba(255, 255, 55, 0.7)",
  // ];

  // Esri color ramps - Purple 2
  // const colors = [
  //   "rgba(255, 252, 212, 1)",
  //   "rgba(200, 188, 212, 1)",
  //   "rgba(144, 124, 212, 1)",
  //   "rgba(80, 70, 146, 1)",
  //   "rgba(16, 16, 79, 1)",
  // ];

  // Esri color ramps - Red 10 (inverse)
  // const colors = [
  //   "rgba(212, 209, 206, 1)",
  //   "rgba(173, 162, 151, 1)",
  //   "rgba(140, 110, 98, 1)",
  //   "rgba(137, 37, 32, 1)",
  //   "rgba(104, 0, 0, 1)",
  // ];

  // Esri color ramps - Red 3
  // const colors = [
  //   "rgba(255, 239, 220, 1)",
  //   "rgba(245, 197, 171, 1)",
  //   "rgba(209, 94, 61, 1)",
  //   "rgba(177, 57, 37, 1)",
  //   "rgba(102, 2, 2, 1)",
  // ];

  return colors[index % colors.length];
}

function getCategoricalColor(index) {
  // Esri color ramps - Falling Leaves
  const colors = [
    "rgba(62, 117, 109, 1)",
    "rgba(217, 215, 140, 1)",
    "rgba(184, 107, 83, 1)",
    "rgba(115, 36, 31, 1)",
    "rgba(176, 191, 162, 1)",
    "rgba(92, 152, 202, 1)",
    "rgba(134, 175, 179, 1)",
    "rgba(173, 157, 99, 1)",
    "rgba(68, 73, 139, 1)",
    "rgba(156, 85, 150, 1)",
  ];
  return colors[index % colors.length];
}
