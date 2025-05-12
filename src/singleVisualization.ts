export function setSingleVis(
  birdData: any,
  arcgisMap: HTMLArcgisSceneElement,
  primaryLayer: __esri.FeatureLayer,
  generalizedLayer: __esri.FeatureLayer,
  secondaryLayer: __esri.FeatureLayer,
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
  // const birdSummary = summarizeData(birdData);
  createAttributeSelects(birdSummary, primaryVisSelect, "altitude");
  createAttributeSelects(birdSummary, secondaryVisSelect, "speed");

  primaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    updateLayerColorVariables(
      primaryVisSelect.value,
      primaryLayer,
      birdSummary,
    );
  });

  secondaryVisSelect?.addEventListener("calciteSelectChange", async () => {
    updateLayerColorVariables(
      secondaryVisSelect.value,
      secondaryLayer,
      birdSummary,
    );
  });
}

//src: chatGPT based on given requirements
export function summarizeData(birdData: any[]) {
  const summary: Record<
    string,
    | { type: "number"; min: number; max: number }
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
      for (const entry of birdData) {
        const value = entry[key];
        if (typeof value === "number" && !isNaN(value)) {
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }
      if (min === max) {
        summary[key] = {
          type: "other",
          values: [min],
        };
      } else {
        summary[key] = { type: "number", min, max };
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

let rendererLine = {
  type: "simple",
  symbol: {
    type: "line-3d",
    symbolLayers: [
      {
        type: "line",
        size: 3,
        cap: "round",
        material: { color: [255, 0, 0] },
      },
    ],
  },
  visualVariables: [],
};

let cylinderRenderer = {
  type: "simple",
  symbol: {
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
  },
  visualVariables: [],
};

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
            size: 3,
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
  const colors = [
    [0, 255, 0, 0.3],
    [150, 255, 0, 0.5],
    [255, 255, 0, 0.7],
    [255, 128, 0, 0.8],
    [255, 0, 0, 0.9],
  ];
  return colors[index % colors.length];
}

function getCategoricalColor(index) {
  const colors = [
    [0, 255, 0],
    [255, 0, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
    [128, 0, 128],
    [128, 128, 0],
    [0, 128, 128],
    [255, 165, 0],
  ];
  return colors[index % colors.length];
}
