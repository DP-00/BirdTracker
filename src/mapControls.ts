import Basemap from "@arcgis/core/Basemap";
import Mesh from "@arcgis/core/geometry/Mesh";
import Graphic from "@arcgis/core/Graphic";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import * as rasterFunctionUtils from "@arcgis/core/layers/support/rasterFunctionUtils";
import TileLayer from "@arcgis/core/layers/TileLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import TimeExtent from "@arcgis/core/time/TimeExtent";
import Slide from "@arcgis/core/webscene/Slide";
import LocalBasemapsSource from "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";
import { updateBirdAndCameraPosition } from "./birdPerspective";
import { updateIcon, updateLine } from "./groupVisualization";
import { updateCalculations } from "./singleVisualization";
import { getClosestFeatureIndexInTime } from "./utils";

export function setBasemaps() {
  const customBasemaps = [
    Basemap.fromId("topo-3d"),
    Basemap.fromId("osm-3d"),
    Basemap.fromId("gray-3d"),
    Basemap.fromId("dark-gray-3d"),
    Basemap.fromId("satellite"),
    Basemap.fromId("hybrid"),
    Basemap.fromId("oceans"),
    Basemap.fromId("topo"),
    Basemap.fromId("gray"),
    Basemap.fromId("dark-gray"),
    Basemap.fromId("osm"),
    new Basemap({
      baseLayers: [
        new TileLayer({
          portalItem: { id: "a66bfb7dd3b14228bf7ba42b138fe2ea" },
        }),
      ],
      title: "Dark Imagery",
      id: "firefly",
    }),
    new Basemap({
      baseLayers: [
        new TileLayer({
          portalItem: { id: "a8588e0401e246469260f03ee44d69f1" },
        }),
      ],
      title: "Vintage Shaded Relief ",
      id: "vintage",
    }),
    new Basemap({
      baseLayers: [
        new ImageryTileLayer({
          url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
          title: "Terrain",
        }),
      ],
      title: "Plain Elevation",
      id: "elevation",
    }),
  ];

  document.querySelector("arcgis-basemap-gallery")!.source =
    new LocalBasemapsSource({ basemaps: customBasemaps });
}

export async function setThematicLayers(arcgisScene: HTMLArcgisSceneElement) {
  const footprintLayer = new TileLayer({
    portalItem: { id: "cfe002c152204bd8b6e392f3f39f2878" },
    visible: false,
  });

  const conopyLayer = new ImageryTileLayer({
    portalItem: { id: "2a3dfb00c2c6425f85bd70da420d58eb" },
    visible: false,
  });
  const biointactnessLayer = new ImageryTileLayer({
    portalItem: { id: "25543641e4ce461baa2b7863dc0f80b7" },
    visible: false,
  });

  const landCoverLayer = new ImageryLayer({
    url: "https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer",
    title: "Land Cover (Sentinel-2 10m)",
    visible: false,
  });

  const ecosystemLayer = new ImageryLayer({
    portalItem: { id: "926a206393ec40a590d8caf29ae9a93e" },
    visible: false,
  });

  const ndviLayer = new ImageryLayer({
    portalItem: { id: "f6bb66f1c11e467f9a9a859343e27cf8" },
    visible: false,
  });

  // Raster Function for Slope
  const slope = rasterFunctionUtils.slope({ slopeType: "degree", zFactor: 1 });

  const remapSlope = rasterFunctionUtils.remap({
    rangeMaps: [
      { range: [30, 35], output: 30 },
      { range: [35, 40], output: 35 },
      { range: [40, 45], output: 40 },
      { range: [45, 90], output: 45 },
    ],
    outputPixelType: "u8",
    raster: slope,
  });

  const colorMapSlope = rasterFunctionUtils.colormap({
    colormap: [
      [30, 255, 255, 0],
      [35, 255, 165, 0],
      [40, 255, 0, 0],
      [45, 128, 0, 128],
    ],
    raster: remapSlope,
  });

  const slopeLayer = new ImageryTileLayer({
    url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
    title: "Slope (°)",
    rasterFunction: colorMapSlope,
    visible: false,
  });

  const DEMLayer = new ImageryTileLayer({
    url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
    title: "Elevation (m.a.s.l)",
    rasterFunction: rasterFunctionUtils.colormap({
      colorRampName: "elevation1",
    }),
    opacity: 0.7,
    visible: false,
  });

  const windspeedLayer = new ImageryTileLayer({
    portalItem: { id: "08be07c69cd4486995d1dc5d175156e3" },
    visible: false,
  });

  const protectedLayer = new VectorTileLayer({
    title: "Protected areas",
    opacity: 0.7,
    visible: false,
    style: {
      layers: [
        {
          id: "WDPA_poly_Latest",
          type: "fill",
          source: "WDPA_World_Database_of_Protected_Areas_VTS",
          "source-layer": "WDPA_poly_Latest",
          layout: {},
          paint: {
            "fill-color": "#71a970",
            "fill-outline-color": "#3d5c3d",
          },
        },
      ],

      glyphs:
        "https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf",
      version: 8,
      sprite:
        "https://www.arcgis.com/sharing/rest/content/items/7675d44bb1e4428aa2c30a9b68f97822/resources/sprites/sprite",
      sources: {
        WDPA_World_Database_of_Protected_Areas_VTS: {
          url: "https://vectortileservices5.arcgis.com/Mj0hjvkNtV7NRhA7/arcgis/rest/services/WDPA_World_Database_of_Protected_Areas_VTS/VectorTileServer",
          type: "vector",
        },
      },
    },
  });

  await arcgisScene.addLayers([
    windspeedLayer,
    footprintLayer,
    biointactnessLayer,
    conopyLayer,
    ecosystemLayer,
    ndviLayer,
    DEMLayer,
    slopeLayer,
    protectedLayer,
    landCoverLayer,
  ]);

  document.querySelector("arcgis-layer-list")!.filterPredicate = (item) =>
    !item.title.toLowerCase().includes("visualization");

  const layerListEl = document.getElementById(
    "thematic-layers",
  ) as HTMLArcgisLayerListElement;

  layerListEl.view = arcgisScene.view;

  layerListEl.listItemCreatedFunction = (
    event: __esri.LayerListListItemCreatedEvent,
  ) => {
    const item = event.item;

    item.panel = {
      content: "legend",
    };
  };
}

export async function setTimeSlider(
  arcgisScene: HTMLArcgisSceneElement,
  fullTimeExtent,
  groupedData,
  birdData,
) {
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;

  const timezonePicker = document.getElementById("timezone-picker")!;
  let animationSwitch = document.getElementById("play-group-animation")!;
  let animationPlayRate = document.getElementById("animation-playrate")!;

  const cameraControl = document.getElementById(
    "camera-control",
  ) as HTMLCalciteSegmentedControlElement;
  const gaugeContainer = document.getElementById("gauges-container");
  const groupLineLayer = arcgisScene.view.map.allLayers.find(
    (layer) => layer.title === "Group visualization",
  );
  const iconLayer = arcgisScene.view.map.allLayers.find(
    (layer) => layer.title === "Icon visualization",
  );

  gaugeContainer!.style.display = "none";
  animationPlayRate!.style.display = "block";
  animationSwitch!.style.display = "block";
  animationPlayRate.value = 10000;

  setDatePicker();

  timezonePicker.addEventListener("calciteInputTimeZoneChange", () => {
    arcgisScene.view.timeZone = timezonePicker.value;
  });

  timeSlider.view = arcgisScene.view;
  timeSlider.fullTimeExtent = fullTimeExtent;
  const start = new Date(timeSlider.fullTimeExtent.start);
  let end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  timeSlider.timeExtent = new TimeExtent({ start, end });
  timeSlider.stops = { interval: { value: 10, unit: "minutes" } };

  timeSlider.addEventListener("arcgisPropertyChange", (event) => {
    let currentTime = timeSlider.timeExtent.end;
    arcgisScene.view.environment.lighting.date = new Date(currentTime);
    updateIcon(groupedData, iconLayer.graphics, timeSlider.timeExtent.end);
    if (groupLineLayer.visible) {
      updateLine(
        groupedData,
        groupLineLayer.graphics,
        timeSlider.timeExtent.end,
      );

      let currentTimeTail = currentTime - 24 * 60 * 60 * 1000;
      if (currentTimeTail <= timeSlider.fullTimeExtent.start) {
        currentTimeTail = timeSlider.fullTimeExtent.start;
      }
      timeSlider.timeExtent.start = currentTimeTail;
    } else {
      updateCalculations(birdData, timeSlider);
    }
  });

  let isPlaying = false;
  let isGroupView = true;
  let isFollowMode = false;
  let birdMesh, animationTarget, initialTransform;

  // SET MODEL

  if (birdData.length > 0) {
    const modelUrl = "./flying_crow_color_north.glb";

    let i = getClosestFeatureIndexInTime(birdData, timeSlider.timeExtent.end);

    birdMesh = (
      await Mesh.createFromGLTF(birdData[i].geometry, modelUrl, {
        vertexSpace: "local",
      })
    ).scale(30);
    initialTransform = birdMesh.transform?.clone();
    animationTarget = new Graphic({
      geometry: birdMesh,
      symbol: new MeshSymbol3D({
        symbolLayers: [
          new FillSymbol3DLayer({
            material: {
              color: [255, 255, 255],
            },
          }),
        ],
      }),
      attributes: {
        id: "bird-model",
      },
    });

    arcgisScene.view.graphics.add(animationTarget);
  }

  cameraControl?.addEventListener("calciteSegmentedControlChange", async () => {
    if (cameraControl.value == "bird") {
      try {
        await arcgisScene.view.goTo(animationTarget);
      } catch (err) {}
      document.body.classList.toggle("bird-mode", true);
      gaugeContainer!.style.display = "block";
      animationPlayRate!.style.display = "block";
      animationSwitch!.style.display = "block";
      animationPlayRate.value = 10;
    } else {
      document.body.classList.toggle("bird-mode", false);

      isPlaying = false;
      gaugeContainer!.style.display = "none";
      animationPlayRate!.style.display = "none";
      animationSwitch!.style.display = "none";
      // arcgisScene.view.goTo(layer.fullExtent);
    }
  });

  animationSwitch.addEventListener("click", () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      animationSwitch.iconStart = "pause-f";
      updateVisualization(timeSlider.timeExtent.end);
    } else {
      animationSwitch.iconStart = "play-f";
    }
  });
  const updateVisualization = (time) => {
    if (isPlaying) {
      requestAnimationFrame(() => {
        let currentTime = updateTimeSlider(40);
        const now = new Date(currentTime);
        const formatted = now
          .toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .toUpperCase()
          .replace(",", "");

        document.getElementById("time-dashboard")!.innerText = formatted;

        updateIcon(groupedData, iconLayer.graphics, time);
        if (cameraControl.value == "bird") {
          updateBirdAndCameraPosition(
            currentTime,
            arcgisScene,
            birdData,
            birdMesh,
            initialTransform,
          );
        } else {
          updateLine(groupedData, groupLineLayer.graphics, currentTime);
        }
        updateVisualization(currentTime);
      });
    }
  };

  function setDatePicker() {
    const startDatePicker = document.getElementById("start-date");
    const startTimePicker = document.getElementById("start-time");
    const endDatePicker = document.getElementById("end-date");
    const endTimePicker = document.getElementById("end-time");
    const datePickerApplyBtn = document.getElementById("apply-range");
    const datePickerPopover = document.getElementById("popover-time");
    const datePickerBtn = document.getElementById("edit-time-button");

    datePickerBtn.addEventListener("click", () => {
      let extent = timeSlider.timeExtent;
      const offsetMinutes = arcgisScene.view.timeZone;
      console.log(
        "start",
        offsetMinutes,
        extent.start,
        extent.start.toISOString(),
      );
      startDatePicker.value = extent.start.toISOString().split("T")[0];
      startTimePicker.value = extent.start.toISOString().slice(11, 16);
      endDatePicker.value = extent.end.toISOString().split("T")[0];
      endTimePicker.value = extent.end.toISOString().slice(11, 16);
    });

    datePickerApplyBtn.addEventListener("click", () => {
      const start = new Date(
        `${startDatePicker.value}T${startTimePicker.value}`,
      );
      const end = new Date(`${endDatePicker.value}T${endTimePicker.value}`);
      timeSlider.timeExtent = new TimeExtent({ start, end });
      datePickerPopover.open = false;
    });

    function validateInputs() {
      const startDateStr = startDatePicker.value;
      const startTimeStr = startTimePicker.value;
      const endDateStr = endDatePicker.value;
      const endTimeStr = endTimePicker.value;

      if (!startDateStr || !startTimeStr || !endDateStr || !endTimeStr) {
        datePickerApplyBtn.disabled = true;
        return;
      }

      const start = new Date(`${startDateStr}T${startTimeStr}`);
      const end = new Date(`${endDateStr}T${endTimeStr}`);
      const fullStart = timeSlider.fullTimeExtent.start;
      const fullEnd = timeSlider.fullTimeExtent.end;

      const valid =
        !isNaN(start) &&
        !isNaN(end) &&
        start < end &&
        start >= fullStart &&
        end <= fullEnd;

      datePickerApplyBtn.disabled = !valid;
    }

    // Revalidate on every change
    [startDatePicker, startTimePicker, endDatePicker, endTimePicker].forEach(
      (input) => {
        input.addEventListener("calciteInputDatePickerChange", validateInputs);
        input.addEventListener("calciteInputTimePickerChange", validateInputs);
        input.addEventListener("change", validateInputs);
      },
    );
  }

  function updateTimeSlider(timeStep) {
    // const timeStep = 40;
    let currentTime =
      timeSlider.timeExtent.end.getTime() + timeStep * animationPlayRate.value;
    if (currentTime >= timeSlider.fullTimeExtent.end) {
      currentTime = timeSlider.fullTimeExtent.start;
    }
    let currentTimeTail = currentTime - 24 * 60 * 60 * 1000;
    if (currentTimeTail <= timeSlider.fullTimeExtent.start) {
      currentTimeTail = timeSlider.fullTimeExtent.start;
    }
    timeSlider.timeExtent.end = currentTime;
    timeSlider.timeExtent.start = currentTimeTail;
    arcgisScene.view.environment.lighting.date = new Date(
      timeSlider.timeExtent.end,
    );

    return currentTime;
  }
}

export function setSlides(arcgisScene: HTMLArcgisSceneElement) {
  const view = arcgisScene.view;

  // const slides = arcgisScene.map.presentation.slides;
  // slides.forEach(createSlideUI);
  document
    .getElementById("createSlideButton")
    ?.addEventListener("click", () => {
      Slide.createFrom(view).then((slide) => {
        // Set the slide title using the text from the title input element
        slide.title.text = document.getElementById(
          "createSlideTitleInput",
        )!.value;
        // arcgisScene.map.presentation.slides.add(slide);
        // Create a UI for the slide with the new slide at the top of the list
        createSlideUI(slide, arcgisScene);
      });
    });
}

function createSlideUI(slide: Slide, arcgisScene: HTMLArcgisSceneElement) {
  const view = arcgisScene.view;
  // Create a new element which contains all the slide information
  const slideElement = document.createElement("calcite-list-item");
  // Assign the ID of the slide to the <span> element
  slideElement.id = slide.id;
  slideElement.label = slide.title?.text ?? "Untitled Slide";

  slideElement.setAttribute("closable", "");
  slideElement.description = slide.environment.lighting.date.toLocaleString();
  slideElement.innerHTML = `<calcite-content slot="content-start">
        <img alt="" title="${slide.title.text}"src="${slide.thumbnail.url}">
      </calcite-content>`;

  document.getElementById("slidesDiv")!.appendChild(slideElement);

  // Set up an event handler on the created slide to toggle the selected slide when clicked
  slideElement.addEventListener("calciteListItemSelect", () => {
    slide.applyTo(view, { maxDuration: 3000, easing: "in-out-coast-cubic" });
  });
  slideElement.addEventListener("calciteListItemClose", () => {
    // remove slide from slides
    arcgisScene.map.presentation.slides.remove(slide);
  });
}
