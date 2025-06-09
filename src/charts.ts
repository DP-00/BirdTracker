export async function setCharts(generalizedLayer) {
  let elevProfile = document.querySelector("arcgis-elevation-profile");

  await generalizedLayer
    .queryFeatures({
      where: "1=1",
      returnGeometry: true,
      returnZ: true,
    })
    .then(async (result) => {
      let path = result.features[0];
      elevProfile.input = path;
      elevProfile.profiles = [
        {
          type: "input",
          color: "#aed8cc",
          title: "Line elevation",
        },
        {
          type: "ground",
          color: "#233935",
          title: "Ground elevation",
          viewVisualizationEnabled: false,
        },
      ];
    });
}
