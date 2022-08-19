import { Vector3 } from "three";
import { degToRad } from "three/src/math/mathutils.js";
import { Database } from "../../database.js";
import { Engine } from "../../engine.js";
import { InputManager } from "../../inputmanager.js";
import { Prop } from "../prop.js";

export class Freecam extends Prop {
    constructor(args) {
        super(args);

        this._data = {
            ...this._data,
            moveSpeed: 10,
            ...Database.entities.freecam.args,
            ...args,
        };

        if (this.isNetworkOwner) {
            this._root.add(Engine.camera);
            Engine.camera.rotation.y += Math.PI;
            this._mesh.visible = false;
        }
    }

    _handleInput(delta) {
        if (InputManager.isMouseLocked) {
            const pos = new Vector3().copy(this._data.position);

            if (InputManager.isKeyDown(`w`)) {
                pos.add(
                    this.forward.multiplyScalar(this._data.moveSpeed * delta)
                );
            }

            if (InputManager.isKeyDown(`a`)) {
                pos.add(
                    this.right.multiplyScalar(-this._data.moveSpeed * delta)
                );
            }

            if (InputManager.isKeyDown(`s`)) {
                pos.add(
                    this.forward.multiplyScalar(-this._data.moveSpeed * delta)
                );
            }

            if (InputManager.isKeyDown(`d`)) {
                pos.add(
                    this.right.multiplyScalar(this._data.moveSpeed * delta)
                );
            }

            if (InputManager.isKeyDown(`e`)) {
                pos.add(
                    new Vector3(0, 1, 0).multiplyScalar(
                        this._data.moveSpeed * delta
                    )
                );
            }

            if (InputManager.isKeyDown(`q`)) {
                pos.add(
                    new Vector3(0, 1, 0).multiplyScalar(
                        -this._data.moveSpeed * delta
                    )
                );
            }

            this.setPosition(pos.x, pos.y, pos.z);
        }
    }

    _handleMouseLook() {
        if (InputManager.isMouseLocked) {
            this._data.rotation._y -= InputManager.mouseDelta.x / 500;
            Engine.camera.rotation.x += InputManager.mouseDelta.y / 500;
            Engine.camera.rotation.x = Math.max(
                degToRad(-85),
                Math.min(degToRad(85), Engine.camera.rotation.x)
            );
        }
    }

    _update(delta) {
        super._update(delta);

        if (this.isNetworkOwner) {
            this._handleInput(delta);
            this._handleMouseLook(delta);
        }
    }
}
