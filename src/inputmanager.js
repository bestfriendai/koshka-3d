import { Settings } from "./settings.js";

export class InputManager {
    static _mouseLocked = false;

    static _keys = {
        w: 87,
        a: 65,
        s: 83,
        d: 68,
        q: 81,
        e: 69,
        f: 70,
        shift: 16,
    };

    static async init() {
        return new Promise((resolve) => {
            document.addEventListener(
                `click`,
                (event) => this._onMouseClick(event),
                false
            );

            let havePointerLock =
                `pointerLockElement` in document ||
                `mozPointerLockElement` in document ||
                `webkitPointerLockElement` in document;

            if (havePointerLock) {
                let element = document.body;

                var pointerlockchange = () => {
                    if (document.pointerLockElement === element) {
                        this._mouseLocked = true;
                    } else {
                        this._mouseLocked = false;
                    }
                };

                var pointerlockerror = () => {
                    this._mouseLocked = false;
                };

                document.addEventListener(
                    `pointerlockchange`,
                    pointerlockchange,
                    false
                );
                document.addEventListener(
                    `mozpointerlockchange`,
                    pointerlockchange,
                    false
                );
                document.addEventListener(
                    `webkitpointerlockchange`,
                    pointerlockchange,
                    false
                );
                document.addEventListener(
                    `pointerlockerror`,
                    pointerlockerror,
                    false
                );
                document.addEventListener(
                    `mozpointerlockerror`,
                    pointerlockerror,
                    false
                );
                document.addEventListener(
                    `webkitpointerlockerror`,
                    pointerlockerror,
                    false
                );
            }

            resolve(`OK`);
        });
    }

    static getKey(key) {
        return this._keys[key];
    }

    static get isMouseLocked() {
        return this._mouseLocked;
    }

    static _onMouseClick() {
        let element = document.body;
        element.requestPointerLock();
    }

    static get keys() {
        return this._keys;
    }
}
