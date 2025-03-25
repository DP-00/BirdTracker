import { tsx } from "@arcgis/core/widgets/support/widget";
import AppStore from "../stores/AppStore";

const SPEED_FACTORS = [0.1, 0.2, 0.5, 1, 2, 3, 5];

const AnimationPanel = ({
  store: appStore,
  onclose,
}: {
  store: AppStore;
  onclose: () => void;
}) => {
  const store = appStore.playerStore;

  const speedFactor = store.speedFactor;
  let speedFactorLabel;
  if (speedFactor === 1) {
    speedFactorLabel = "normal";
  } else if (speedFactor < 1) {
    speedFactorLabel = `${1 / speedFactor}x slower`;
  } else {
    speedFactorLabel = `${speedFactor}x faster`;
  }

  const selectedSpeedFactor = SPEED_FACTORS.indexOf(speedFactor);

  const disablePause = store.transition === "linear";

  const pauseValue =
    store.transition === "linear" ? "None" : store.pauseBetweenSlides;
  const pauseOptions = ["None", "Short", "Long"].map((option) => ({
    value: option,
    checked: option === pauseValue,
  }));

  const waitForUpdates = store.transition !== "linear" && store.waitForUpdates;

  return (
    <calcite-panel
      key="animation-panel"
      heading="Animation"
      description="Adjust speed and transitions"
      closable
      onCalcitePanelClose={onclose}
    >
      <calcite-block open>
        <calcite-label>
          Speed ({speedFactorLabel})
          <calcite-slider
            value={selectedSpeedFactor}
            min="0"
            label-handles
            max={SPEED_FACTORS.length - 1}
            ticks="1"
            onCalciteSliderInput={(e: any) =>
              (store.speedFactor = SPEED_FACTORS[e.target.value])
            }
          ></calcite-slider>
        </calcite-label>

        <calcite-label>
          Transitions
          <calcite-radio-button-group
            name="Transition"
            layout="horizontal"
            onCalciteRadioButtonChange={(e: any) => {
              store.transition = e.target.value;
            }}
          >
            <calcite-label layout="inline">
              <calcite-radio-button
                value="bounce"
                checked={store.transition === "bounce"}
              ></calcite-radio-button>
              Bounce
            </calcite-label>
            <calcite-label layout="inline">
              <calcite-radio-button
                value="linear"
                checked={store.transition === "linear"}
              ></calcite-radio-button>
              Linear
            </calcite-label>
          </calcite-radio-button-group>
        </calcite-label>

        <calcite-label>
          Pause between slides
          <calcite-segmented-control
            width="full"
            onCalciteSegmentedControlChange={(e: any) => {
              store.pauseBetweenSlides = e.target.value;
            }}
            disabled={disablePause}
          >
            {pauseOptions.map((option) => (
              <calcite-segmented-control-item
                value={option.value}
                checked={option.checked}
              >
                {option.value}
              </calcite-segmented-control-item>
            ))}
          </calcite-segmented-control>
        </calcite-label>

        <calcite-label layout="inline-space-between">
          Wait for view to update
          <calcite-switch
            onCalciteSwitchChange={(e: any) => {
              store.waitForUpdates = !store.waitForUpdates;
            }}
            checked={waitForUpdates}
            disabled={disablePause}
          ></calcite-switch>
        </calcite-label>
      </calcite-block>
    </calcite-panel>
  );
};

export default AnimationPanel;
