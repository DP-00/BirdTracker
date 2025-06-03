import Camera from "@arcgis/core/Camera";
import Mesh from "@arcgis/core/geometry/Mesh";
import Point from "@arcgis/core/geometry/Point";
import MeshGeoreferencedVertexSpace from "@arcgis/core/geometry/support/MeshGeoreferencedVertexSpace";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import Graphic from "@arcgis/core/Graphic";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";

export async function setBirdPerspective(arcgisScene, pointLayer) {
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  let f = await getLatestVisibleFeature(pointLayer, timeSlider);
  let feature = f.features[0];
  let feature2 = f.features[1];

  const end = new Date(feature.attributes.timestamp);
  let start = new Date(end.getTime() - 600000);
  // timeSlider.timeExtent = new TimeExtent({ start, end });
  console.log(timeSlider.timeExtent);

  // timeSlider.stops = { count: 100 };
  // timeSlider.stops = null;

  let point = new Point({
    latitude: feature.geometry.latitude,
    longitude: feature.geometry.longitude,
    z: 10000,
    // z: feature.attributes.altitude,
  });

  let paragliderMesh = (
    await Mesh.createFromGLTF(point, "./data/flying_synthwave_bird.glb", {
      vertexSpace: "local",
    })
  )
    .scale(100)
    .rotate(0, 0, 180);
  await paragliderMesh.load();

  const animationTarget = new Graphic({
    geometry: paragliderMesh,
    symbol: new MeshSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: {
            color: [255, 255, 255],
          },
        }),
      ],
    }),
  });

  const mesh = new Mesh({
    spatialReference: paragliderMesh.spatialReference,
    vertexSpace: paragliderMesh.vertexSpace,
    vertexAttributes: {
      position: [0, 500, 200],
    } as any,
  });

  await arcgisScene.view.graphics.add(animationTarget);
  await arcgisScene.view.goTo(point);

  timeSlider.addEventListener("arcgisPropertyChange", async (event) => {
    let f = await getLatestVisibleFeature(pointLayer, timeSlider);
    let feature = f.features[0];
    // let feature2 = f.features[1];
    let point = new Point({
      latitude: feature.geometry.latitude,
      longitude: feature.geometry.longitude,
      z: feature.attributes.altitude + 10,
    });
    paragliderMesh.centerAt(point);
    // let h = Math.floor(heading(feature2.geometry, feature.geometry));

    // let t = Math.floor(heading(feature2.geometry, feature.geometry));

    mesh.centerAt(point);
    // mesh.rotate(0, t, h);
    const cameraMesh = await meshUtils.convertVertexSpace(
      mesh,
      new MeshGeoreferencedVertexSpace(),
    );
    arcgisScene.view.camera = new Camera({
      position: new Point({
        spatialReference: cameraMesh.spatialReference,
        x: cameraMesh.vertexAttributes.position[0],
        y: cameraMesh.vertexAttributes.position[1],
        z: cameraMesh.vertexAttributes.position[2],
      }),
      heading: 180,
      tilt: 70,
    });

    document.getElementById("dashboard-current").innerHTML =
      `Speed: ${feature.attributes.speed}   Altitde: ${feature.attributes.altitude}`;
  });

  function heading(a: Point, b: Point) {
    const atan2 = Math.atan2(b.y - a.y, b.x - a.x);
    return 180 - (atan2 * 180) / Math.PI;
  }
}

async function getLatestVisibleFeature(pointLayer, timeSlider) {
  const timeExtent = timeSlider.timeExtent;
  const query = pointLayer.createQuery();
  query.where = "1=1";
  query.timeExtent = timeExtent;
  query.outFields = ["*"];
  query.orderByFields = ["timestamp DESC"];
  query.returnGeometry = true;
  query.num = 2; // Get only the latest one

  try {
    const result = await pointLayer.queryFeatures(query);
    if (result.features.length > 0) {
      return result;
    } else {
      console.log("No feature found in time range");
      return null;
    }
  } catch (err) {
    console.error("Query failed: ", err);
    return null;
  }
}
