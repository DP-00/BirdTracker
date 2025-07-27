import Polyline from "@arcgis/core/geometry/Polyline";
import { interpolate } from "./utils";

// Esri color ramps - Falling Leaves
const colors = [
  "rgba(115, 36, 31, 1)",
  "rgba(68, 73, 139, 1)",
  "rgba(92, 152, 202, 1)",
  "rgba(62, 117, 109, 1)",
  "rgba(217, 215, 140, 1)",
  "rgba(184, 107, 83, 1)",
];

// export async function setGroupVis(groupedData, arcgisScene) {
//   const groupLineLayer = new GraphicsLayer({
//     title: "Group visualization",
//     elevationInfo: {
//       mode: "absolute-height",
//     },
//   });

//   const lineGraphics = Object.entries(groupedData).map(([birdId], i) => {
//     const color = colors[i % colors.length];

//     return new Graphic({
//       geometry: new Polyline({
//         spatialReference: { wkid: 4326 },
//         hasZ: true,
//         paths: [],
//       }),
//       symbol: new LineSymbol3D({
//         symbolLayers: [
//           new LineSymbol3DLayer({
//             material: {
//               color: color,
//               // @ts-ignore
//               emissive: {
//                 strength: 2,
//                 source: "color",
//               },
//             },
//             cap: "round",
//             join: "round",
//             size: 3,
//           }),
//         ],
//       }),
//       attributes: {
//         birdId,
//         color,
//       },
//     });
//   });

//   groupLineLayer.addMany(lineGraphics);

//   return groupLineLayer;
// }

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
