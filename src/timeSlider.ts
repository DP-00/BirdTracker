import Camera from "@arcgis/core/Camera";
import Mesh from "@arcgis/core/geometry/Mesh";
import Point from "@arcgis/core/geometry/Point";
import Polyline from "@arcgis/core/geometry/Polyline";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import Graphic from "@arcgis/core/Graphic";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import TimeExtent from "@arcgis/core/time/TimeExtent";
import { updateCalculations } from "./singleVisualization";
import {
  findLayersByTitles,
  formatDate,
  getClosestFeatureIndexInTime,
  getClosestPointInTime,
  getHeading,
  interpolate,
  lerp,
  toDateInput,
  toTimeInput,
} from "./utils";

export async function setTimeSlider(
  arcgisScene: HTMLArcgisSceneElement,
  fullTimeExtent,
  groupedData,
  birdData,
) {
  const oneDay = 24 * 60 * 60 * 1000;
  const view = arcgisScene.view;
  const timeSlider = document.querySelector("arcgis-time-slider")!;
  // const timezonePicker = document.getElementById("timezone-picker")!;
  const startDatePickerSection = document.getElementById("date-picker-start")!;
  const playAnimation = document.getElementById("play-group-animation")!;
  const animationPlayRate = document.getElementById("animation-playrate")!;
  const modeControl = document.getElementById("camera-control")!;
  const gaugeContainer = document.getElementById("gauges-container")!;
  const groupLineLayer = findLayersByTitles(view, "Group visualization");
  const iconLayer = findLayersByTitles(view, "Icon visualization");
  const pointLayer = findLayersByTitles(view, "Line visualization");
  const groupedFeatures: Record<string, any[]> = {};
  const coordinatesData: Record<string, [number, number, number][]> = {};

  // generate new data form for faster animation
  for (const birdId in groupedData) {
    const features: any[] = [];
    const coordinates: [number, number, number][] = [];
    for (const point of groupedData[birdId]) {
      coordinates.push([point.longitude, point.latitude, point.altitude]);
      const { longitude, latitude, altitude, ...attributes } = point;
      features.push({
        geometry: {
          x: longitude,
          y: latitude,
          z: altitude,
          spatialReference: { wkid: 4326 },
        },
        attributes,
      });
    }
    groupedFeatures[birdId] = features;
    coordinatesData[birdId] = coordinates;
  }

  // set timeslider
  timeSlider.view = view;
  timeSlider.fullTimeExtent = fullTimeExtent;
  const start = timeSlider.fullTimeExtent.start;
  const end = start.getTime() + oneDay;
  timeSlider.timeExtent = new TimeExtent({ start, end });
  timeSlider.stops = { interval: { value: 10, unit: "minutes" } };

  timeSlider.addEventListener("arcgisPropertyChange", (event) => {
    let currentTime = timeSlider.timeExtent.end;
    view.environment.lighting.date = currentTime;
    updateIcon(currentTime);
    if (groupLineLayer.visible) {
      updateGroupLines(currentTime);
      timeSlider.timeExtent.start = Math.max(
        currentTime - oneDay,
        timeSlider.fullTimeExtent.start,
      ); // ensure 24 hour tail
    } else {
      updateCalculations(birdData, timeSlider);
    }
  });
  // timezonePicker.addEventListener("calciteInputTimeZoneChange", () => {
  //   view.timeZone = timezonePicker.value;
  // });
  setDatePicker();

  // set mode change
  const modelUrl = "./flying_crow_color_north.glb";
  let birdMesh, initialTransform;
  if (birdData.length > 0) {
    birdMesh = await setBirdModel();
    initialTransform = birdMesh.transform?.clone();
  }
  startDatePickerSection.style.display = "none";
  gaugeContainer.style.display = "none";
  animationPlayRate.style.display = "block";
  playAnimation.style.display = "block";
  modeControl?.addEventListener("calciteSegmentedControlChange", async () => {
    if (modeControl.value == "bird") {
      try {
        await view.goTo(birdMesh);
      } catch (err) {}
      document.body.classList.toggle("bird-mode", true);
      startDatePickerSection.style.display = "none";
      gaugeContainer!.style.display = "block";
      animationPlayRate!.style.display = "block";
      playAnimation!.style.display = "block";
      animationPlayRate.value = 10;
    } else {
      document.body.classList.toggle("bird-mode", false);
      isPlaying = false;
      startDatePickerSection.style.display = "block";

      gaugeContainer!.style.display = "none";
      animationPlayRate!.style.display = "none";
      playAnimation!.style.display = "none";
    }
  });

  document
    .getElementById("camera-zoom")!
    .addEventListener("click", async () => {
      view.goTo(pointLayer.fullExtent);
    });

  // set animations
  let isPlaying = false;
  animationPlayRate.value = 10000;
  playAnimation.addEventListener("click", () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playAnimation.iconStart = "pause-f";
      updateVisualization();
    } else {
      playAnimation.iconStart = "play-f";
    }
  });

  const updateVisualization = () => {
    if (isPlaying) {
      requestAnimationFrame(() => {
        let currentTime = updateTimeSlider(40);
        document.getElementById("time-dashboard")!.innerText =
          formatDate(currentTime);
        updateIcon(currentTime);
        if (modeControl.value == "bird") {
          updateBirdPerspective(currentTime);
        } else {
          updateGroupLines(currentTime);
        }
        updateVisualization();
      });
    }
  };

  function updateTimeSlider(timeStep) {
    let currentTime =
      timeSlider.timeExtent.end.getTime() + timeStep * animationPlayRate.value;
    if (currentTime >= timeSlider.fullTimeExtent.end) {
      currentTime = timeSlider.fullTimeExtent.start;
    }
    timeSlider.timeExtent.end = currentTime;

    timeSlider.timeExtent.start = Math.max(
      currentTime - oneDay,
      timeSlider.fullTimeExtent.start,
    ); // ensure 24 hour tail

    view.environment.lighting.date = timeSlider.timeExtent.end;

    return currentTime;
  }

  function updateGroupLines(time) {
    groupLineLayer.graphics.forEach((lineGraphic) => {
      const birdFeature = groupedFeatures[lineGraphic.attributes.birdId];
      const coordinates = coordinatesData[lineGraphic.attributes.birdId];

      let i = getClosestFeatureIndexInTime(birdFeature, time);
      let j = getClosestFeatureIndexInTime(birdFeature, time - oneDay);

      if (i < birdFeature.length - 1) {
        const point = getClosestPointInTime(birdFeature, time, i);
        const newLine = new Polyline({
          hasZ: true,
          spatialReference: { wkid: 4326 },
          paths: [
            coordinates
              .slice(j, i + 1)
              .concat([[point.x, point.y, point.z ?? 0]]),
          ],
        });
        lineGraphic.geometry = newLine;
      }
    });
  }

  function updateIcon(time) {
    iconLayer.graphics.forEach((iconGraphic) => {
      const birdFeature = groupedFeatures[iconGraphic.attributes.birdId];
      let i = getClosestFeatureIndexInTime(birdFeature, time);
      if (i < birdFeature.length - 1) {
        const point = getClosestPointInTime(birdFeature, time, i);

        if (iconGraphic.geometry) {
          iconGraphic.geometry = point;
        }
      }
    });
  }

  async function updateBirdPerspective(time) {
    let cameraSide = document.getElementById("camera-side");
    let isFollowing = cameraSide.value === "bird-camera-free" ? true : false;
    let isFront =
      cameraSide.value === "bird-camera-back" ||
      cameraSide.value === "bird-camera-left"
        ? -1
        : 1;
    let cameraSideOffset =
      cameraSide.value === "bird-camera-right" ||
      cameraSide.value === "bird-camera-left"
        ? 120
        : 0;

    let i = getClosestFeatureIndexInTime(birdData, time);

    if (i < birdData.length - 1) {
      const t =
        (time - birdData[i].attributes.timestamp) /
        (birdData[i + 1].attributes.timestamp -
          birdData[i].attributes.timestamp);
      const p1 = birdData[i].geometry;
      const p2 = birdData[i + 1].geometry;
      const point = interpolate(p1, p2, t);
      let heading = getHeading(p1, point);
      let altitude = Math.floor(lerp(p1.z, p2.z, t));
      let speed = Math.floor(
        lerp(birdData[i].attributes.speed, birdData[i + 1].attributes.speed, t),
      );

      birdMesh.centerAt(point);
      birdMesh.transform = initialTransform?.clone();
      birdMesh.offset(0, 0, 10);
      birdMesh.rotate(0, 0, -heading);

      const birdOrigin = webMercatorUtils.geographicToWebMercator(
        birdMesh.origin,
      ) as Point;
      const x =
        birdOrigin.x -
        isFront *
          (40 + cameraSideOffset) *
          Math.sin(((heading - cameraSideOffset) * Math.PI) / 180);
      const y =
        birdOrigin.y -
        isFront *
          (40 + cameraSideOffset) *
          Math.cos(((heading - cameraSideOffset) * Math.PI) / 180);
      const z = birdOrigin.z + 5;
      if (!isFollowing) {
        view.camera = new Camera({
          position: new Point({
            spatialReference: birdOrigin.spatialReference,
            x,
            y,
            z,
          }),
          heading: heading - cameraSideOffset,
          tilt: isFront * 90,
          fov: 105,
        });
      }

      document.gauges.get("speedGauge").value = speed;
      document.gauges.get("headingGauge").value = heading;
      document.gauges.get("altitudeGauge").value = altitude;
    }
  }

  async function setBirdModel() {
    let i = getClosestFeatureIndexInTime(birdData, timeSlider.timeExtent.end);

    let birdMesh = (
      await Mesh.createFromGLTF(birdData[i].geometry, modelUrl, {
        vertexSpace: "local",
      })
    ).scale(30);
    let animationTarget = new Graphic({
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

    view.graphics.add(animationTarget);
    return birdMesh;
  }

  function setDatePicker() {
    const startDatePicker = document.getElementById("start-date")!;
    const startTimePicker = document.getElementById("start-time")!;
    const endDatePicker = document.getElementById("end-date")!;
    const endTimePicker = document.getElementById("end-time")!;
    const datePickerApplyBtn = document.getElementById("apply-range")!;
    const datePickerPopover = document.getElementById("popover-time")!;
    const datePickerBtn = document.getElementById("edit-time-button")!;

    // set initial date value
    datePickerBtn.addEventListener("click", () => {
      const { start, end } = timeSlider.timeExtent;
      startDatePicker.value = toDateInput(start);
      startTimePicker.value = toTimeInput(start);
      endDatePicker.value = toDateInput(end);
      endTimePicker.value = toTimeInput(end);
    });

    // apply chosen date
    datePickerApplyBtn.addEventListener("click", () => {
      const end = new Date(`${endDatePicker.value}T${endTimePicker.value}Z`);
      timeSlider.timeExtent.end = end;
      if (startDatePickerSection.style.display === "block") {
        const start = new Date(
          `${startDatePicker.value}T${startTimePicker.value}Z`,
        );
        timeSlider.timeExtent.start = start;
      } else {
        timeSlider.timeExtent.start = Math.max(
          end - oneDay,
          timeSlider.fullTimeExtent.start,
        );
      }

      datePickerPopover.open = false;
    });

    function validateInputs() {
      const end = new Date(`${endDatePicker.value}T${endTimePicker.value}Z`);

      let start: Date;
      let valid = false;

      if (startDatePickerSection.style.display === "block") {
        start = new Date(`${startDatePicker.value}T${startTimePicker.value}Z`);
        valid =
          !isNaN(start.getTime()) &&
          !isNaN(end.getTime()) &&
          start < end &&
          start >= timeSlider.fullTimeExtent.start &&
          end <= timeSlider.fullTimeExtent.end;
      } else {
        start = new Date(0);
        valid = !isNaN(end.getTime()) && end <= timeSlider.fullTimeExtent.end;
      }

      datePickerApplyBtn.disabled = !valid;
    }

    // Revalidate on every change
    [startDatePicker, startTimePicker, endDatePicker, endTimePicker].forEach(
      (input) => {
        [
          "calciteInputDatePickerChange",
          "calciteInputTimePickerChange",
          "change",
        ].forEach((evt) => input.addEventListener(evt, validateInputs));
      },
    );
  }
}
