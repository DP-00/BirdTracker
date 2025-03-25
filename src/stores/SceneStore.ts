import Accessor from "@arcgis/core/core/Accessor";
import {
  property,
  subclass,
} from "@arcgis/core/core/accessorSupport/decorators";
import { whenOnce } from "@arcgis/core/core/reactiveUtils";
import SceneView from "@arcgis/core/views/SceneView";
import WebScene from "@arcgis/core/WebScene";

@subclass()
class SceneStore extends Accessor {
  @property({ aliasOf: "view.map" })
  map: WebScene;

  @property()
  view: SceneView | null;

  @property()
  loading = true;

  constructor() {
    super();

    whenOnce(() => this.view).then(async () => {
      try {
        await this.map.loadAll();
      } finally {
        this.loading = false;
      }
    });
  }
}

export default SceneStore;
