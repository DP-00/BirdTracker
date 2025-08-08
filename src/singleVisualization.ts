import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";

import Color from "@arcgis/core/Color";
import * as geodeticDistanceOperator from "@arcgis/core/geometry/operators/geodeticDistanceOperator";
import * as geodeticLengthOperator from "@arcgis/core/geometry/operators/geodeticLengthOperator";

import histogram from "@arcgis/core/smartMapping/statistics/histogram";
import * as colorSymbology from "@arcgis/core/smartMapping/symbology/color";
import ColorSlider from "@arcgis/core/widgets/smartMapping/ColorSlider";

import { createDynamicPopupTemplate } from "./layers";

import Polyline from "@arcgis/core/geometry/Polyline";
import * as colorRendererCreator from "@arcgis/core/smartMapping/renderers/color.js";
import IconSymbol3DLayer from "@arcgis/core/symbols/IconSymbol3DLayer";
import PointSymbol3D from "@arcgis/core/symbols/PointSymbol3D";
import { formatDate, getClosestFeatureIndexInTime } from "./utils";
export async function setSingleVis(
  arcgisScene: HTMLArcgisSceneElement,
  primaryLayer: __esri.FeatureLayer,
  secondaryLayer: __esri.FeatureLayer,
  arrowLayer: __esri.GraphicsLayer,
  dayLayer,
  birdSummary: Record<string, any>,
  primaryValue: string,
  secondaryValue: string,
  birdData,
  polyline,
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

  if (!geodeticLengthOperator.isLoaded()) {
    await geodeticLengthOperator.load();
  }

  const length = geodeticLengthOperator.execute(polyline.geometry);

  const startTime = new Date(birdData[0].timestamp).getTime();
  const endTime = new Date(birdData[birdData.length - 1].timestamp).getTime();
  let durationSeconds = (endTime - startTime) / 1000;
  const days = Math.floor(durationSeconds / (3600 * 24));
  durationSeconds -= days * 3600 * 24;
  const hours = Math.floor(durationSeconds / 3600);

  document.getElementById("dashboard-birdid")!.innerText = birdData[0].birdid;
  document.getElementById("dashboard-duration")!.innerHTML =
    `${days} d ${hours} h  |  ${formatDate(startTime)} - ${formatDate(endTime)}  | ${(length / 1000).toFixed(0)} km <br>`;

  setLayerVisibility();

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

  createAttributeSelects(birdSummary, primaryVisSelect, primaryValue);
  primaryVisSelect.value = primaryValue;
  createAttributeSelects(birdSummary, secondaryVisSelect, secondaryValue);
  secondaryVisSelect.value = secondaryValue;

  document.getElementById("line-variable")!.innerText =
    primaryVisSelect.value.charAt(0).toUpperCase() +
    primaryVisSelect.value.slice(1);
  document.getElementById("cylinder-variable")!.innerText =
    secondaryVisSelect.value.charAt(0).toUpperCase() +
    secondaryVisSelect.value.slice(1);

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

  console.log("bef", primaryColorScale);

  primaryColorScale.innerHTML = "";
  primaryColorScale.className = "";
  secondaryColorScale.innerHTML = "";
  secondaryColorScale.className = "";

  console.log("aft", primaryColorScale);

  await createColorSlider(primaryVisSelect.value, primaryLayer, "primary");
  await createColorSlider(
    secondaryVisSelect.value,
    secondaryLayer,
    "secondary",
  );

  document.getElementById("time-zoom")!.addEventListener("click", async () => {
    const layerView = await arcgisScene.view.whenLayerView(primaryLayer);

    const { extent } = await layerView.queryExtent();
    if (extent) {
      arcgisScene.view.goTo({
        target: extent,
        heading: 0,
        tilt: 0,
      });
    }
  });

  primaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    arcgisScene.view.whenLayerView(primaryLayer).then((layerView) => {
      layerView.filter = null;
    });

    document.getElementById("line-variable")!.innerText =
      primaryVisSelect.value.charAt(0).toUpperCase() +
      primaryVisSelect.value.slice(1);

    updateLayerColorVariables(
      primaryVisSelect.value,
      primaryLayer,
      birdSummary,
    );
    await createColorSlider(primaryVisSelect.value, primaryLayer, "primary");
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

    const summary = birdSummary[primaryVisSelect.value];
    if (summary.type == "number") {
      const lineChartElement = document.getElementById("line-chart")!;
      await lineChartElement.model.setNumericFields([primaryVisSelect.value]);
      lineChartElement.model.setTemporalBinningUnit("seconds");
      lineChartElement.model.setYAxisTitleText(
        primaryVisSelect.value.charAt(0).toUpperCase() +
          primaryVisSelect.value.slice(1),
      );
      lineChartElement.refresh();
      document.getElementById("line-chart")!.style.display = "block";
      document.getElementById("bar-chart")!.style.display = "none";
      document.getElementById("set-time-chart")!.style.display = "none";
      document.getElementById("chart-cursor-mode")!.style.display = "block";
    } else {
      const barChartElement = document.getElementById("bar-chart")!;
      barChartElement.refresh();
      document.getElementById("line-chart")!.style.display = "none";
      document.getElementById("bar-chart")!.style.display = "block";
      document.getElementById("set-time-chart")!.style.display = "block";
      document.getElementById("chart-cursor-mode")!.style.display = "none";
    }
  });

  secondaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    arcgisScene.view.whenLayerView(secondaryLayer).then((layerView) => {
      layerView.filter = null;
    });

    document.getElementById("cylinder-variable")!.innerText =
      secondaryVisSelect.value.charAt(0).toUpperCase() +
      secondaryVisSelect.value.slice(1);
    updateLayerColorVariables(
      secondaryVisSelect.value,
      secondaryLayer,
      birdSummary,
    );
    await createColorSlider(
      secondaryVisSelect.value,
      secondaryLayer,
      "secondary",
    );

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

  function setLayerVisibility() {
    const lineVisibility = document.getElementById("visibility-line");
    const cylinderVisibility = document.getElementById("visibility-cylinders");
    const generalizedVisibility = document.getElementById(
      "visibility-generalized",
    );
    const extremumsVisibility = document.getElementById("visibility-extremums");
    const timeMarksVisibility = document.getElementById("visibility-timemarks");
    lineVisibility?.addEventListener("calciteCheckboxChange", async () => {
      primaryLayer.visible = !primaryLayer.visible;
    });
    cylinderVisibility?.addEventListener("calciteCheckboxChange", async () => {
      secondaryLayer.visible = !secondaryLayer.visible;
    });
    generalizedVisibility?.addEventListener(
      "calciteCheckboxChange",
      async () => {
        const generalizedLayer = arcgisScene.view.map.allLayers.find(
          (layer) => layer.title === "Generlized visualization",
        );
        generalizedLayer.visible = !generalizedLayer.visible;
      },
    );
    extremumsVisibility?.addEventListener("calciteCheckboxChange", async () => {
      arrowLayer.visible = !arrowLayer.visible;
    });
    timeMarksVisibility?.addEventListener("calciteCheckboxChange", async () => {
      dayLayer.visible = !dayLayer.visible;
    });
  }

  function createAttributeSelects(
    birdSummary: Record<string, any>,
    select: HTMLCalciteSelectElement,
    defaultValue: string,
  ) {
    select.innerHTML = "";
    const attributes = Object.keys(birdSummary);

    attributes.forEach((attribute) => {
      const option = document.createElement("calcite-option");
      option.value = option.label = option.textContent = attribute;
      if (attribute === defaultValue) {
        option.setAttribute("selected", ""); // for second rerendering
      }
      select.appendChild(option);
    });

    select.value = defaultValue;
  }

  async function createColorSlider(
    variable,
    layer: __esri.FeatureLayer,
    layerType,
  ) {
    const summary = birdSummary[variable];
    const currentRenderer = layer.renderer.clone();
    let container;
    let colorScaleContainer;
    let legendContainer;

    if (layerType == "primary") {
      container = "color-slider-primary";
      resetSliderContainer(container);
      colorScaleContainer = primaryColorScale;
      legendContainer = primaryLegend;
    } else {
      container = "color-slider-secondary";
      resetSliderContainer(container);
      colorScaleContainer = secondaryColorScale;
      legendContainer = secondaryLegend;
    }

    if (!summary) {
      legendContainer!.style.display = "block";
      colorScaleContainer!.style.display = "none";
      return;
    } else if (summary.type === "number") {
      colorScaleContainer.innerHTML = "";
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

  function resetSliderContainer(containerId: string): HTMLDivElement {
    const oldContainer = document.getElementById(containerId);
    if (!oldContainer || !oldContainer.parentNode) return null;

    const newContainer = document.createElement("div");
    newContainer.id = containerId;
    oldContainer.parentNode.replaceChild(newContainer, oldContainer);
    return newContainer;
  }
}

export async function updateCalculations(birdData, timeSlider) {
  const startTime = timeSlider.timeExtent.start;
  const endTime = timeSlider.timeExtent.end;

  let i = getClosestFeatureIndexInTime(birdData, endTime);
  let j = getClosestFeatureIndexInTime(birdData, startTime);

  // let i = 0;
  // while (
  //   i < birdData.length - 1 &&
  //   endTime > birdData[i + 1].attributes.timestamp
  // ) {
  //   i++;
  // }

  // let j = 0;
  // while (
  //   j < birdData.length - 1 &&
  //   startTime > birdData[j + 1].attributes.timestamp
  // ) {
  //   j++;
  // }

  if (birdData[i] && birdData[j]) {
    const lastPoint = birdData[i].geometry;
    const firstPoint = birdData[j].geometry;

    let durationSeconds = (endTime - startTime) / 1000;

    const daysSelected = Math.floor(durationSeconds / (3600 * 24));
    durationSeconds -= daysSelected * 3600 * 24;
    const hoursSelected = Math.floor(durationSeconds / 3600);
    const sumHoursSelected = daysSelected * 24 + hoursSelected;

    const verticalDiff = Math.abs(firstPoint.z - lastPoint.z);
    if (!geodeticDistanceOperator.isLoaded()) {
      await geodeticDistanceOperator.load();
    }

    const pathPoints = birdData
      .slice(j, i + 1)
      .map((p) => [p.geometry.x, p.geometry.y, p.geometry.z]);

    const newLine = new Polyline({
      hasZ: true,
      spatialReference: { wkid: 4326 },
      paths: [pathPoints],
    });

    let distanceToLine = geodeticDistanceOperator.execute(
      firstPoint,
      lastPoint,
    );
    let distanceToLine2 = geodeticLengthOperator.execute(newLine);
    document.getElementById("time-distance")!.innerHTML =
      `Speed: →  ${(distanceToLine / 1000 / sumHoursSelected).toFixed(2)} ↑ ${(verticalDiff / 1000 / sumHoursSelected).toFixed(2)}  km/h<br>
    Distance: ${(distanceToLine2 / 1000).toFixed(0)}km 
    `;

    document.getElementById("time-duration")!.innerHTML =
      `${daysSelected} days and ${hoursSelected} hours`;
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
      slider.minLabel = summary.min;
      slider.maxLabel = summary.max;
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
      // combobox.setAttribute("overlay-positioning", "fix");

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
      value: summary.min.toFixed(0),
      color: "#192a27",
      direction: "down",
    },
    {
      location: summary.maxLocation,
      value: summary.max.toFixed(0),
      color: "#4c1010bb",
      direction: "up",
    },
  ];

  const drawTriangle = (
    value: string,
    direction: "up" | "down",
    color: string,
  ) => {
    const canvas = document.createElement("canvas");
    const width = 50;
    const height = 50;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    if (direction === "down") {
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-width / 2, -height / 2);
    }

    // Draw triangle
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#aed8cc";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";

    if (direction === "up") {
      ctx.textBaseline = "bottom";
      ctx.fillText(value, width / 2, height - 4);
    } else {
      ctx.textBaseline = "top";
      ctx.fillText(value, width / 2, 6);
    }

    return canvas.toDataURL("image/png");
  };

  const graphics = arrows.map(({ location, value, color, direction }) => {
    const point = new Point({
      longitude: location.longitude,
      latitude: location.latitude,
      z: (location.z || 0) + 15,
      spatialReference: { wkid: 4326 },
    });

    return new Graphic({
      geometry: point,
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            resource: {
              href: drawTriangle(value, direction, color),
            },
            anchor: "bottom",
            anchorPosition: { x: 0, y: 0 },
            size: 35,
          }),
        ],
        verticalOffset: {
          screenLength: 80,
          maxWorldLength: 1000000,
          minWorldLength: 0,
        },
        callout: {
          type: "line",
          size: 3,
          color,
        },
      }),
    });
  });

  arrowLayer.addMany(graphics);
}

export function updateLayerColorVariables(variable, layer, birdSummary) {
  const summary = birdSummary[variable];
  const currentRenderer = layer.renderer.clone();
  if (!summary) {
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
