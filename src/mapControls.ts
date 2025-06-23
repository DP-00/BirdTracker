import Basemap from "@arcgis/core/Basemap";
import ImageryLayer from "@arcgis/core/layers/ImageryLayer";
import ImageryTileLayer from "@arcgis/core/layers/ImageryTileLayer";
import * as rasterFunctionUtils from "@arcgis/core/layers/support/rasterFunctionUtils";
import TileLayer from "@arcgis/core/layers/TileLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import TimeExtent from "@arcgis/core/time/TimeExtent";
import Slide from "@arcgis/core/webscene/Slide";
import LocalBasemapsSource from "@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";

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
    title: "Sentinel-2 10m Land Cover",
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
    footprintLayer,
    biointactnessLayer,
    conopyLayer,
    landCoverLayer,
    ecosystemLayer,
    ndviLayer,
    windspeedLayer,
    DEMLayer,
    slopeLayer,
    protectedLayer,
  ]);

  document.querySelector("arcgis-layer-list")!.filterPredicate = (item) =>
    !item.title.toLowerCase().includes("visualization");

  document.getElementById("thematic-layers-legend")!.layerInfos =
    arcgisScene.map.layers
      .filter(
        (layer) =>
          layer.title && !layer.title.toLowerCase().includes("visualization"),
      )
      .map((layer) => ({
        layer,
        title: layer.title,
      }));
}

export function setTimeSlider(
  arcgisScene: HTMLArcgisSceneElement,
  layer: __esri.FeatureLayer,
) {
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;

  timeSlider.view = arcgisScene.view;

  timeSlider.fullTimeExtent = layer.timeInfo?.fullTimeExtent;

  const start = new Date(timeSlider.fullTimeExtent.start);

  let end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  timeSlider.timeExtent = new TimeExtent({ start, end });
  timeSlider.stops = { count: 10000 };
  // timeSlider.stops = null;

  // timeSlider.stops = { interval: { value: 2, unit: "minutes" } };
  timeSlider.addEventListener("arcgisPropertyChange", (event) => {
    arcgisScene.view.environment.lighting.date = new Date(
      timeSlider.timeExtent.end,
    );
  });

  document
    .getElementById("time-window")!
    .addEventListener("calciteSelectChange", (e) => {
      const hours = parseInt(e.target.value);
      const end = new Date(timeSlider.timeExtent.end);
      let start = new Date(end.getTime() - hours * 60 * 60 * 1000);
      if (start < new Date(timeSlider.fullTimeExtent.start)) {
        start = new Date(timeSlider.fullTimeExtent.start);
      }
      timeSlider.timeExtent = new TimeExtent({ start, end });
    });

  document
    .getElementById("speed")!
    .addEventListener("calciteSelectChange", (e) => {
      timeSlider.playRate = parseFloat(e.target.value);
    });
  document
    .getElementById("stops")!
    .addEventListener("calciteSelectChange", (e) => {
      if (e.target.value === "continous") {
        timeSlider.stops = { count: 10000 };
      } else {
        timeSlider.stops = { interval: { value: 1, unit: e.target.value } };
      }
    });

  const timezonePicker = document.getElementById("timezone-picker");
  timezonePicker.addEventListener("calciteInputTimeZoneChange", () => {
    console.log("azone", arcgisScene.map);
    // arcgisMap.timeZone = timezonePicker.value; // original
    // arcgisScene.timeZone = timezonePicker.value; // X
    // arcgisScene.map.timeZone = timezonePicker.value; // X
  });
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
