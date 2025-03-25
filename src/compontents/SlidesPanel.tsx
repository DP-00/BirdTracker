import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-block";
import "@esri/calcite-components/dist/components/calcite-block-section";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-card";
import "@esri/calcite-components/dist/components/calcite-card-group";
import "@esri/calcite-components/dist/components/calcite-label";
import "@esri/calcite-components/dist/components/calcite-list";
import "@esri/calcite-components/dist/components/calcite-list-item";
import "@esri/calcite-components/dist/components/calcite-notice";
import "@esri/calcite-components/dist/components/calcite-pagination";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-radio-button";
import "@esri/calcite-components/dist/components/calcite-radio-button-group";
import "@esri/calcite-components/dist/components/calcite-segmented-control";
import "@esri/calcite-components/dist/components/calcite-segmented-control-item";
import "@esri/calcite-components/dist/components/calcite-slider";
import "@esri/calcite-components/dist/components/calcite-switch";

import { watch } from "@arcgis/core/core/reactiveUtils";
import PlayerStore from "../stores/PlayerStore";
import { Widget } from "./Widget";

const SPEED_FACTORS = [0.1, 0.2, 0.5, 1, 2, 3, 5];

const SlidesPanel = ({
  store,
  onclose,
}: {
  store: PlayerStore;
  onclose: () => void;
}) => {
  const slides = store.slides;

  return (
    <calcite-panel
      key="slides-panel"
      heading="Slides"
      description="Select animation start"
      closable
      onCalcitePanelClose={onclose}
    >
      <calcite-list
        selection-mode="single"
        // selection-appearance="icon"
        selection-appearance="border"
        style="max-height: 400px;"
      >
        {slides.map((s, i) => {
          return (
            <calcite-list-item
              key={`slide-${i}`}
              label={s.title.text}
              description={s.description.text}
              selected={i === store.currentSlide}
              onclick={() => store.goToSlide(i)}
            >
              <div
                slot="content-start"
                class="list-item-slide"
                style={`--bg-image: url('${s.thumbnail.url}');`}
              ></div>
            </calcite-list-item>
          );
        })}
      </calcite-list>
    </calcite-panel>
  );
};

export default SlidesPanel;

@subclass("arcgis-core-template.Player")
class BPlayer extends Widget<{}> {
  @property()
  store: PlayerStore;

  @property()
  get quality() {
    return this.store.sceneStore.view?.qualityProfile || "medium";
  }
  set quality(quality: "high" | "medium" | "low") {
    const view = this.store.sceneStore.view;
    if (view) {
      view.qualityProfile = quality;
    }
  }

  @property()
  private selectedSpeedFactor = SPEED_FACTORS.indexOf(1);

  postInitialize() {
    this.addHandles([
      watch(
        () => this.selectedSpeedFactor,
        (selectedSpeedFactor) => {
          this.store.speedFactor = SPEED_FACTORS[selectedSpeedFactor];
        },
      ),
    ]);
  }

  render() {
    const slides = this.store.slides;

    const loading = !slides;

    const disabled = slides && slides.length === 0;
    const reverseDisabled = !this.store.canReverse;
    const forwardDisabled = !this.store.canForward;

    const animating = this.store.state !== "ready";

    return (
      <div>
        <calcite-panel heading="Slides" loading={loading} style="width: 300px;">
          <calcite-action
            icon="refresh"
            text="Previous slide"
            slot="header-actions-end"
            disabled={disabled}
            onclick={() => this.store.reset()}
          ></calcite-action>
          <calcite-action
            icon="reverse"
            text="Previous slide"
            slot="header-actions-end"
            disabled={reverseDisabled}
            onclick={() => this.store.reverse()}
          ></calcite-action>
          <calcite-action
            icon="forward"
            text="Nesxt slide"
            slot="header-actions-end"
            disabled={forwardDisabled}
            onclick={() => this.store.forward()}
          ></calcite-action>

          {this.renderStaging(animating ? "" : "hide")}

          <calcite-button
            width="full"
            slot="footer"
            appearance="outline"
            disabled={disabled}
            onclick={() => this.store.stop()}
            class={animating ? "" : "hide"}
          >
            Cancel
          </calcite-button>
          <calcite-button
            width="full"
            slot="footer"
            icon-start="video-web"
            disabled={disabled}
            onclick={() => this.store.play()}
            class={animating ? "hide" : ""}
          >
            Play
          </calcite-button>
        </calcite-panel>
      </div>
    );
  }

  private renderStaging(classString: string) {
    return (
      <calcite-block open class={classString}>
        <calcite-notice open icon="information" scale="s">
          <div slot="message">
            Interrupt by pressing space bar or interacting with scene.
          </div>
        </calcite-notice>
      </calcite-block>
    );
  }
}
