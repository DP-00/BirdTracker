import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import { TextSymbol } from "@arcgis/core/symbols";
import { createDynamicPopupTemplate } from "./layers";

export function setSingleVis(
  birdData: any,
  arcgisMap: HTMLArcgisSceneElement,
  primaryLayer: __esri.FeatureLayer,
  generalizedLayer: __esri.FeatureLayer,
  secondaryLayer: __esri.FeatureLayer,
  arrowLayer: __esri.GraphicsLayer,
  birdSummary: Record<string, any>,
) {
  //   const primaryLayer = arcgisMap.view.map.layers.find(
  //     (layer) => layer.title === "Primary visualization",
  //   );

  document.getElementById("vis-layers")!.filterPredicate = (item) =>
    item.title.toLowerCase().includes("visualization");

  const primaryVisSelect = document.getElementById(
    "primary-vis-select",
  ) as HTMLCalciteSelectElement;
  const secondaryVisSelect = document.getElementById(
    "secondary-vis-select",
  ) as HTMLCalciteSelectElement;

  // const attributes = Object.keys(birdData);
  createAttributeSelects(birdSummary, primaryVisSelect, "altitude");
  createAttributeSelects(birdSummary, secondaryVisSelect, "speed");

  primaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    updateLayerColorVariables(
      primaryVisSelect.value,
      primaryLayer,
      birdSummary,
    );
    createFilters(
      arcgisMap,
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
    updateLayerColorVariables(
      secondaryVisSelect.value,
      secondaryLayer,
      birdSummary,
    );

    createFilters(
      arcgisMap,
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
          values: [min],
        };
      } else {
        summary[key] = {
          type: "number",
          min,
          max,
          mean: count > 0 ? sum / min : NaN,
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

function createAttributeSelects(
  birdSummary: Record<string, any>,
  select: HTMLCalciteSelectElement,
  defaultValue: string,
) {
  select.innerHTML = "";
  const attributes = Object.keys(birdSummary);

  if (!attributes.includes("---single color---")) {
    attributes.unshift("---single color---");
  }

  attributes.forEach((attribute) => {
    const option = document.createElement("calcite-option");
    option.value = option.label = option.textContent = attribute;
    select.appendChild(option);
  });
  select.value = defaultValue;
}

function createFilters(
  arcgisMap: HTMLArcgisSceneElement,
  layer: __esri.FeatureLayer,
  birdSummary: Record<string, any>,
  container: HTMLElement,
  variable: string,
) {
  container.innerHTML = "";
  const summary = birdSummary[variable];
  if (summary.type == "number") {
    const slider = document.createElement("calcite-slider");
    slider.minValue = summary.min;
    slider.maxValue = summary.max;
    slider.min = summary.min;
    slider.max = summary.max;
    slider.style = "width:250px";
    slider.setAttribute("label-handles", "");
    slider.addEventListener("calciteSliderChange", async () => {
      const minValue = slider.minValue;
      const maxValue = slider.maxValue;

      arcgisMap.view.whenLayerView(layer).then((layerView) => {
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

      arcgisMap.view.whenLayerView(layer).then((layerView) => {
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
      icon: "\ue60a", // Down arrow
      label: summary.min.toFixed(0),
      color: [255, 0, 0],
    },
    {
      location: summary.maxLocation,
      icon: "\ue60d", // Up arrow
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
        color: [30, 30, 30],
        haloColor: [150, 150, 150, 0.5],
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

function updateLayerColorVariables(variable, layer, birdSummary) {
  const summary = birdSummary[variable];
  const currentRenderer = layer.renderer.clone();

  if (!summary || variable === "---single color---") {
    currentRenderer.visualVariables = [];
    currentRenderer.uniqueValueInfos = [];
    currentRenderer.type = "simple";
    layer.renderer = currentRenderer;
    return;
  }

  if (summary.type === "number") {
    // currentRenderer.uniqueValueInfos = [];
    // currentRenderer.type = "simple";
    currentRenderer.visualVariables = createVisualVariablesRenderer(
      variable,
      summary,
    );

    layer.renderer = currentRenderer;
  } else {
    const uniqueRenderer = createUniqueValueRenderer(
      variable,
      summary.values,
      currentRenderer,
    ); // error on second selection
    layer.renderer = uniqueRenderer;
  }
}

function createUniqueValueRenderer(variable, uniqueValues, currentRenderer) {
  const baseSymbol = currentRenderer?.symbol;
  let symbol;
  const uniqueValueInfos = uniqueValues.map((val, i) => {
    console.log("val", val);
    console.log("baseSymbol.type", baseSymbol);
    if (baseSymbol.type === "point-3d") {
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
    } else if (baseSymbol.type === "line-3d") {
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

  console.log("uniqr", uniqueValueInfos);

  return {
    type: "unique-value",
    field: variable,
    uniqueValueInfos,
  };
}

function createVisualVariablesRenderer(variable, summary) {
  const { min, max } = summary;

  const step = (max - min) / 4;
  const stops = Array.from({ length: 5 }, (_, i) => ({
    value: +(min + i * step).toFixed(2),
    color: getContinuousColor(i),
  }));

  return [
    {
      type: "color",
      field: variable,
      stops,
    },
  ];
}

function getContinuousColor(index) {
  // Esri color ramps - Viridis
  const colors = [
    "rgba(96, 88, 190, 0.7)",
    "rgba(65, 158, 203, 0.7)",
    "rgba(44, 220, 198, 0.7)",
    "rgba(111, 255, 153, 0.7)",
    "rgba(255, 255, 55, 0.7)",
  ];

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
