import Mesh from "@arcgis/core/geometry/Mesh";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import { ArcgisTimeSlider } from "@arcgis/map-components/dist/components/arcgis-time-slider";

export async function setBirdPerspective(arcgisScene, pointLayer) {
  const timeSlider = document.querySelector(
    "arcgis-time-slider",
  )! as ArcgisTimeSlider;
  let feature = await getLatestVisibleFeature(pointLayer, timeSlider);
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

  console.log(paragliderMesh);
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

  await arcgisScene.view.graphics.add(animationTarget);
  await arcgisScene.view.goTo(point);

  timeSlider.addEventListener("arcgisPropertyChange", async (event) => {
    let feature = await getLatestVisibleFeature(pointLayer, timeSlider);
    let point = new Point({
      latitude: feature.geometry.latitude,
      longitude: feature.geometry.longitude,
      z: feature.attributes.altitude + 10,
    });
    paragliderMesh.centerAt(point);
    document.getElementById("dashboard-current").innerHTML =
      `Speed: ${feature.attributes.speed}   Altitde: ${feature.attributes.altitude}`;
  });
}

async function getLatestVisibleFeature(pointLayer, timeSlider) {
  const timeExtent = timeSlider.timeExtent;
  const query = pointLayer.createQuery();
  query.where = "1=1";
  query.timeExtent = timeExtent;
  query.outFields = ["*"];
  query.orderByFields = ["timestamp DESC"];
  query.returnGeometry = true;
  query.num = 1; // Get only the latest one

  try {
    const result = await pointLayer.queryFeatures(query);
    if (result.features.length > 0) {
      return result.features[0];
    } else {
      console.log("No feature found in time range");
      return null;
    }
  } catch (err) {
    console.error("Query failed: ", err);
    return null;
  }
}
