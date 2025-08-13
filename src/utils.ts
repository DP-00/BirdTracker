import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";

export function timeout(timeoutInMilliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutInMilliseconds);
  });
}

export function toDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

export function toTimeInput(date: Date) {
  return date.toISOString().slice(11, 16);
}

export function formatDate(time) {
  const now = new Date(time);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const formatted = formatter.format(now).toUpperCase().replace(",", "");

  return formatted;
}

export function findLayersByTitles(
  view: __esri.SceneView,
  titles: string | string[],
) {
  const titleArray = Array.isArray(titles) ? titles : [titles];
  const matched = view.map.allLayers.filter((layer) =>
    titleArray.includes(layer.title),
  );
  return Array.isArray(titles) ? matched : matched.getItemAt(0);
}

export function removeLayersByTitles(view: __esri.SceneView, titles: string[]) {
  const layersToRemove = findLayersByTitles(view, titles);
  layersToRemove.forEach((layer) => {
    view.map.remove(layer);
  });
}

export function getHeading(a, b) {
  const atan2 = Math.PI / 2 - Math.atan2(b.y - a.y, b.x - a.x);
  return (atan2 * 180) / Math.PI;
}
// ALL ARG NUMBERS
export const lerp = (a, b, t) => {
  let d = b - a;

  return a + d * t;
};

export const interpolate = (a, b, t) => {
  const isArray = Array.isArray(a) && Array.isArray(b);

  const ax = isArray ? a[0] : a.x;
  const ay = isArray ? a[1] : a.y;
  const az = isArray ? (a[2] ?? 0) : (a.z ?? 0);

  const bx = isArray ? b[0] : b.x;
  const by = isArray ? b[1] : b.y;
  const bz = isArray ? (b[2] ?? 0) : (b.z ?? 0);

  return new Point({
    x: lerp(ax, bx, t),
    y: lerp(ay, by, t),
    z: lerp(az, bz, t),
    spatialReference: isArray
      ? { wkid: 4326 }
      : (a.spatialReference ?? { wkid: 4326 }),
  });
};

export function getCoordinatesFromFeatures(features: Graphic[]): number[][] {
  return features
    .filter((f) => f.geometry?.type === "point")
    .map((f) => {
      const { x, y, z } = f.geometry as __esri.Point;
      return [x, y, z ?? 0];
    });
}

export function getClosestFeatureIndexInTime(features, time) {
  let i = 0;
  while (
    i < features.length - 1 &&
    time > features[i + 1].attributes.timestamp
  ) {
    i++;
  }

  return i;
}

export function getClosestPointInTime(features, time, i?: number) {
  if (i === undefined) {
    i = getClosestFeatureIndexInTime(features, time);
  }
  const t =
    (time - features[i].attributes.timestamp) /
    (features[i + 1].attributes.timestamp - features[i].attributes.timestamp);
  const p1 = features[i].geometry;
  const p2 = features[i + 1].geometry;
  const p = interpolate(p1, p2, t);

  return p;
}


export function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

