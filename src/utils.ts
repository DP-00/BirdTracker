import Point from "@arcgis/core/geometry/Point";

export function timeout(timeoutInMilliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutInMilliseconds);
  });
}

export function removeLayersByTitles(view: __esri.SceneView, titles: string[]) {
  const layersToRemove = view.map.allLayers.filter((layer) =>
    titles.includes(layer.title),
  );

  layersToRemove.forEach((layer) => {
    view.map.remove(layer);
    console.log(`Removed layer: ${layer.title}`);
  });
}

export function getHeading(a, b) {
  const atan2 = Math.PI / 2 - Math.atan2(b.y - a.y, b.x - a.x);
  return (atan2 * 180) / Math.PI;
}
// ALL ARG NUMBERS
export const lerp = (a, b, t, modulo) => {
  let d = b - a;
  if (modulo) {
    if (d > modulo / 2) {
      d = -d + modulo;
    } else if (d < -modulo / 2) {
      d = d + modulo;
    }
  }
  return a + d * t;
};
// A, B - GRAPHIC geometry, T - NUMBER
export const interpolate = (a, b, t) => {
  const origin = new Point({
    spatialReference: a.spatialReference,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  });
  return origin;
};

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
