import { tsx } from "@arcgis/core/widgets/support/widget";
import AppStore from "../stores/AppStore";

const SettingsPanel = ({
  store: appStore,
  onclose,
}: {
  store: AppStore;
  onclose: () => void;
}) => {
  const store = appStore.playerStore;
  const view = appStore.sceneStore.view;

  const selectQualityProfile = (high: boolean) => {
    if (view) {
      view.qualityProfile = high ? "high" : "medium";
    }
  };

  return (
    <calcite-panel
      key="settings-panel"
      heading="Settings"
      description="Scene rendering"
      closable
      onCalcitePanelClose={onclose}
    >
      <calcite-block open>
        <calcite-label layout="inline-space-between">
          High quality
          <calcite-switch
            checked={view?.qualityProfile === "high"}
            onCalciteSwitchChange={(e: any) =>
              selectQualityProfile(e.target.checked)
            }
          ></calcite-switch>
        </calcite-label>

        <calcite-label>
          Camera angle ({Math.floor(store.fov)}°)
          <calcite-slider
            value={store.fov}
            min="1"
            label-handles
            label-ticks
            max="165"
            ticks="54"
            precise
            onCalciteSliderInput={(e: any) => {
              store.fov = e.target.value;
            }}
          ></calcite-slider>
        </calcite-label>
      </calcite-block>
    </calcite-panel>
  );
};
export default SettingsPanel;
