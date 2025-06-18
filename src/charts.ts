export async function setCharts(path) {
  let elevProfile = document.querySelector("arcgis-elevation-profile");

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
}
