import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";

import { tsx } from "@arcgis/core/widgets/support/widget";

import { ArcgisSceneCustomEvent } from "@arcgis/map-components";
import "@arcgis/map-components/dist/components/arcgis-fullscreen";
import "@arcgis/map-components/dist/components/arcgis-placement";
import "@arcgis/map-components/dist/components/arcgis-scene";

import AppStore, { ActionMenu } from "../stores/AppStore";
import SlidesPanel from "./SlidesPanel";
import { Widget } from "./Widget";

import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-action-group";
import "@esri/calcite-components/dist/components/calcite-action-pad";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-menu";
import "@esri/calcite-components/dist/components/calcite-menu-item";
import "@esri/calcite-components/dist/components/calcite-navigation";
import "@esri/calcite-components/dist/components/calcite-navigation-logo";
import "@esri/calcite-components/dist/components/calcite-navigation-user";
import PlayerStore from "../stores/PlayerStore";
import AnimationPanel from "./AnimationPanel";
import SettingsPanel from "./SettingsPanel";

type AppProperties = {};

const params = new URLSearchParams(document.location.search.slice(1));

@subclass()
class App extends Widget<AppProperties> {
  @property({ constructOnly: true })
  store = new AppStore();

  @property()
  webSceneId = params.get("webscene") || "91b46c2b162c48dba264b2190e1dbcff";

  private bindView(arcgisScene: HTMLArcgisSceneElement) {
    const view = arcgisScene.view;
    this.store.sceneStore.view = view;
  }

  render() {
    const store = this.store;

    return (
      <div>
        <calcite-shell class="app-shell">
          <AppNavigation store={store}></AppNavigation>

          <calcite-shell-panel slot="panel-start" collapsed>
            <AppMenu store={store}></AppMenu>
          </calcite-shell-panel>

          <calcite-panel>
            <calcite-shell content-behind="true" class="scene-shell">
              <calcite-shell-panel slot="panel-start" display-mode="float">
                <AppPanel store={store}></AppPanel>
              </calcite-shell-panel>
            </calcite-shell>
            <arcgis-scene
              item-id={this.webSceneId}
              onArcgisViewReadyChange={(e: ArcgisSceneCustomEvent<void>) =>
                this.bindView(e.target)
              }
            >
              <arcgis-placement position="top-right">
                <arcgis-Fullscreen></arcgis-Fullscreen>
              </arcgis-placement>
            </arcgis-scene>
          </calcite-panel>
        </calcite-shell>
      </div>
    );
  }
}

const AppNavigation = ({ store }: { store: AppStore }) => {
  const portalItem = store.sceneStore.map?.portalItem;
  const itemPageUrl = portalItem?.itemPageUrl;

  const userStore = store?.userStore;

  const user = (userStore?.authenticated && userStore?.user) || null;

  return (
    <calcite-navigation slot="header">
      <calcite-navigation-logo
        slot="logo"
        heading={portalItem?.title}
        description="ArcGIS Maps SDK for JavaScript"
        thumbnail="./icon-64.svg"
        onclick={() => {
          if (itemPageUrl) {
            window.open(itemPageUrl, "new");
          }
        }}
      ></calcite-navigation-logo>

      <Player store={store.playerStore}></Player>

      {user ? (
        <calcite-navigation-user
          slot="user"
          thumbnail={user.thumbnailUrl}
          full-name={user.fullName}
          username={user.username}
        ></calcite-navigation-user>
      ) : (
        <calcite-menu slot="content-end">
          <calcite-menu-item
            onclick={() => userStore?.signIn()}
            text="Sign in"
            icon-start="user"
            text-enabled
          ></calcite-menu-item>
        </calcite-menu>
      )}
    </calcite-navigation>
  );
};

const Player = ({ store }: { store: PlayerStore }) => {
  if (store.state === "starting") {
    return (
      <calcite-button
        key="cancel"
        appearance="outline"
        kind="neutral"
        slot="content-center"
        style="align-self: center;"
        loading
        onclick={() => store.stop()}
      >
        Starting - press to cancel
      </calcite-button>
    );
  } else if (store.state !== "animating") {
    return (
      <calcite-button
        key="start"
        slot="content-center"
        icon-start="video-web"
        style="align-self: center;"
        disabled={store.state === "loading"}
        onclick={() => store.play()}
      >
        Animate slides
      </calcite-button>
    );
  } else {
    return [];
  }
};

const AppMenu = ({ store }: { store: AppStore }) => {
  const toggleMenu = (menu: ActionMenu) => {
    if (store.selectedMenu === menu) {
      store.selectedMenu = null;
    } else {
      store.selectedMenu = menu;
    }
  };

  return (
    <calcite-action-bar slot="action-bar" class="calcite-mode-dark">
      <calcite-action
        icon="presentation"
        text="Slides"
        active={store.selectedMenu === "slides"}
        onclick={() => toggleMenu("slides")}
      ></calcite-action>
      <calcite-action
        icon="effects"
        text="Animation"
        active={store.selectedMenu === "animation"}
        onclick={() => toggleMenu("animation")}
      ></calcite-action>
      <calcite-action
        icon="gear"
        text="Settings"
        active={store.selectedMenu === "settings"}
        onclick={() => toggleMenu("settings")}
      ></calcite-action>
    </calcite-action-bar>
  );
};

const AppPanel = ({ store }: { store: AppStore }) => {
  switch (store.selectedMenu) {
    case "slides":
      return (
        <SlidesPanel
          store={store.playerStore}
          onclose={() => (store.selectedMenu = null)}
        ></SlidesPanel>
      );
    case "animation":
      return (
        <AnimationPanel
          store={store}
          onclose={() => (store.selectedMenu = null)}
        ></AnimationPanel>
      );
    case "settings":
      return (
        <SettingsPanel
          store={store}
          onclose={() => (store.selectedMenu = null)}
        ></SettingsPanel>
      );
    default:
      return <div></div>;
  }
};

export default App;
