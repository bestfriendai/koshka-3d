import { TextureLoader } from "three";

export class Skybox {
    constructor(front, back, top, bottom, left, right) {
        return;

        this._loader = new TextureLoader();
        this._materialArray = this.createMaterialArray(
            front,
            back,
            top,
            bottom,
            left,
            right
        );
    }

    createMaterialArray(front, back, top, bottom, left, right) {
        const textures = [
            this._loader.load(front),
            this._loader.load(back),
            this._loader.load(top),
            this._loader.load(bottom),
            this._loader.load(left),
            this._loader.load(right),
        ];

        console.log(textures);
    }
}
