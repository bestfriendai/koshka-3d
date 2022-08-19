import { PhysicsProp } from "./physicsprop.js";
import { InputManager } from "../inputmanager.js";
import { Vector3 } from "three";
import { Engine } from "../engine.js";
import { degToRad } from "three/src/math/mathutils.js";

export class Character extends PhysicsProp {
    constructor(args) {
        super(args);

        this._data = {
            ...this._data,
            ownerIsPlayer: false,
            acceleration: 20,
            ...args,
        };

        this._isPlayer = false;
        this._direction = new Vector3();
        this._keys = [];
        this._fPressed = false;
        this._lastAnimation = 0;

        if (this._data.ownerIsPlayer) {
            this.setPlayer(this._data.ownerID);
        }
    }

    setPlayer(ownerID) {
        this._data.ownerID = ownerID;

        if (this.isNetworkOwner) {
            this._root.add(Engine.camera);
            Engine.camera.rotation.y += Math.PI;
            Engine.camera.position.y += this._data.halfHeight * 2 - 0.4;
            this._mesh.visible = false;
            document.addEventListener(
                `mousemove`,
                (event) => this._onMouseMove(event),
                false
            );
            document.addEventListener(
                `mousedown`,
                (event) => this._onMouseDown(event),
                false
            );
            document.addEventListener(
                `mouseup`,
                (event) => this._onMouseUp(event),
                false
            );
            document.addEventListener(
                `keydown`,
                (event) => this._onKeyDown(event),
                false
            );
            document.addEventListener(
                `keyup`,
                (event) => this._onKeyUp(event),
                false
            );
            Engine.setPlayer(this);
        }
    }

    _update(delta) {
        super._update(delta);

        if (this.isNetworkOwner) {
            this._handleInput();
            this._handleMovement(delta);
        }

        // if (this._mixer !== undefined) {
        //     if (this._data.animationIndex !== this._lastAnimation) {
        //         this.transitionAnimation(this._data.animationIndex, 0.1);
        //         this._lastAnimation = this._data.animationIndex;
        //     }
        // }
    }

    _move(event) {
        const key = event.keyCode;

        if (InputManager.isMouseLocked) {
            if (!this._keys.includes(key)) {
                this._keys.push(key);
            }
        }
    }

    _release(event) {
        const key = event.keyCode;

        if (this._keys.includes(key)) {
            this._keys = this._keys.filter((f) => {
                return f !== key;
            });
        }
    }

    _handleInput() {
        this._direction.set(0, 0, 0);
        this._direction.z += this._keys.includes(InputManager.getKey(`w`))
            ? 1
            : 0;
        this._direction.z += this._keys.includes(InputManager.getKey(`s`))
            ? -1
            : 0;
        this._direction.x += this._keys.includes(InputManager.getKey(`d`))
            ? 1
            : 0;
        this._direction.x += this._keys.includes(InputManager.getKey(`a`))
            ? -1
            : 0;
        this._direction.y += this._keys.includes(InputManager.getKey(`e`))
            ? 1
            : 0;
        this._direction.y += this._keys.includes(InputManager.getKey(`q`))
            ? -1
            : 0;
        this._direction.normalize();

        if (!this._fPressed) {
            if (this._keys.includes(InputManager.getKey(`f`))) {
                const v = this._body.translation();
                v.y += 5;
                this._body.setTranslation(v);
                this._fPressed = true;
            }
        } else {
            if (!this._keys.includes(InputManager.getKey(`f`))) {
                this._fPressed = false;
            }
        }
    }

    _handleMouseMove(event) {
        if (InputManager.isMouseLocked) {
            this._data.rotation.y -= event.movementX / 500;
            Engine.camera.rotation.x += event.movementY / 500;
            Engine.camera.rotation.x = Math.max(
                degToRad(-85),
                Math.min(degToRad(85), Engine.camera.rotation.x)
            );
        }
    }

    _handleMovement(delta) {
        const forward = this.forward.multiplyScalar(
            this._direction.z * this._data.acceleration * delta
        );
        const right = this.right.multiplyScalar(
            this._direction.x * this._data.acceleration * delta
        );
        const up = this.up.multiplyScalar(
            this._direction.y * this._data.acceleration * delta
        );
        this._data.velocity.add(forward.add(right).add(up));
        const v = this._data.velocity;
        this._handleAnimations(delta);
        this._body.applyImpulse(v, true);
        this._data.velocity.set(0, 0, 0);
    }

    _handleAnimations(delta) {
        if (this._data.velocity.length() > 0) {
            this._data.animationIndex = 1;
        } else {
            this._data.animationIndex = 0;
        }
    }

    _onMouseMove(event) {
        this._handleMouseMove(event);
    }

    _onMouseStop() {}

    _onMouseClick() {}

    _onMouseDown(event) {}

    _onMouseUp(event) {}

    _onKeyDown(event) {
        this._move(event);
    }

    _onKeyUp(event) {
        this._release(event);
    }
}
