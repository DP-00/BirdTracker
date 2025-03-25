import Accessor from "@arcgis/core/core/Accessor";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import { whenOnce } from "@arcgis/core/core/reactiveUtils";
import PlayerStore from "./PlayerStore";
import SceneStore from "./SceneStore";
import UserStore from "./UserStore";

export type ActionMenu = "animation" | "slides" | "settings";

@subclass()
class AppStore extends Accessor {
  @property({ constructOnly: true })
  sceneStore = new SceneStore();

  @property({ constructOnly: true })
  userStore = new UserStore();

  @property({ constructOnly: true })
  playerStore: PlayerStore;

  @property()
  selectedMenu: ActionMenu | null = null;

  constructor() {
    super();

    this.playerStore = new PlayerStore({ sceneStore: this.sceneStore });

    whenOnce(() => this.sceneStore.map).then(async (map) => {
      await map.load();
      document.title = map.portalItem.title;
    });
  }
}

export default AppStore;
