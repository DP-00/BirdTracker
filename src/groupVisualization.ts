import Polyline from "@arcgis/core/geometry/Polyline";
import { interpolate } from "./utils";

export function updateLine(groupedData, lineGraphics: any[], time) {
  lineGraphics.forEach((lineGraphic) => {
    const birdId = lineGraphic.attributes.birdId;
    const birdData = groupedData[birdId];
    const coordinates = birdData.map((point) => ({
      x: point.longitude,
      y: point.latitude,
      z: point.altitude,
      spatialReference: { wkid: 4326 },
    }));
    let i = 0;
    while (i < birdData.length - 1 && time > birdData[i + 1].timestamp) {
      i++;
    }

    const prev24 = time - 24 * 60 * 60 * 1000;
    let j = 0;
    while (j < birdData.length - 1 && prev24 > birdData[j + 1].timestamp) {
      j++;
    }

    if (i < birdData.length - 1) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const t =
        (time - birdData[i].timestamp) /
        (birdData[i + 1].timestamp - birdData[i].timestamp);
      const point = interpolate(p1, p2, t);
      const pathPoints = coordinates
        .slice(j, i + 1)
        .concat([point])
        .map((pt) => [pt.x, pt.y, pt.z]);

      const newLine = new Polyline({
        hasZ: true,
        spatialReference: { wkid: 4326 },
        paths: [pathPoints],
      });
      lineGraphic.geometry = newLine;
    }
  });
}

export function updateIcon(groupedData, iconGraphics: any[], time) {
  iconGraphics.forEach((iconGraphic) => {
    const birdId = iconGraphic.attributes.birdId;
    const birdData = groupedData[birdId];
    const coordinates = birdData.map((point) => ({
      x: point.longitude,
      y: point.latitude,
      z: point.altitude,
      spatialReference: { wkid: 4326 },
    }));
    let i = 0;
    while (i < birdData.length - 1 && time > birdData[i + 1].timestamp) {
      i++;
    }

    if (i < birdData.length - 1) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const t =
        (time - birdData[i].timestamp) /
        (birdData[i + 1].timestamp - birdData[i].timestamp);
      const point = interpolate(p1, p2, t);

      if (
        iconGraphic.geometry &&
        Number.isFinite(iconGraphic.geometry.x) &&
        Number.isFinite(iconGraphic.geometry.y)
      ) {
        iconGraphic.geometry = point;
      } else {
        iconGraphic.geometry;
      }
    }
  });
}
