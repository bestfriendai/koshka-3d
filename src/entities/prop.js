import {
    AnimationMixer,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Box3Helper,
} from "three";
import { Database } from "../database.js";
import { Entity } from "./entity.js";
import { clone } from "../lib/skeletonutils.js";
import { OBB } from "three/examples/jsm/math/OBB.js";
import { Settings } from "../settings.js";

export class Prop extends Entity {
    constructor(args) {
        super(args);

        this._data = {
            ...this._data,
            propID: `box`,
            static: false,
            boundsBlacklist: [],
            animationIndex: 0,
            ...args,
        };
        this._mesh = undefined;
        this._children = {};
        this._mixer = undefined;
        this._animations = undefined;
        this._currentAnimation = undefined;
        this._firstFrame = true;

        this.setModel(this._data.propID);
    }

    setModel(id) {
        if (id === `box`) {
            const geometry = new BoxGeometry(1, 1, 1);
            const material = new MeshBasicMaterial({
                color: 0x0000ff,
            });
            this._mesh = new Mesh(geometry, material);
            this._root.add(this._mesh);
        } else {
            if (!(id in Database.models)) {
                this.log(`Invalid model ID '${id}'!`, 3);
                this.setModel(`box`);

                return;
            }

            this._mesh = clone(Database.models[id].mesh);
            this._mesh.name = id;
            this._mixer = new AnimationMixer(this._mesh);
            this._animations = Database.models[id].animations;
            this._root.add(this._mesh);

            if (this._animations.length > 0) {
                this.setAnimation(this._data.animationIndex);
            }
        }

        this._mesh.traverse((child) => {
            if (
                child.geometry &&
                !this._data.boundsBlacklist.includes(child.name)
            ) {
                child.geometry.computeBoundingBox();
                child.geometry.userData.obb = new OBB().fromBox3(
                    child.geometry.boundingBox
                );
                const colour = child.name.match(`_col`) ? 0x00ff00 : 0xff0000;
                const helper = new Box3Helper(
                    child.geometry.boundingBox,
                    colour
                );
                helper.visible =
                    Settings.game.debug && Settings.game.debugDrawBounds
                        ? true
                        : false;
                this._root.add(helper);

                this._children[child.name] = {
                    geometry: child.geometry,
                    material: child.material,
                    helper: helper,
                    obb: new OBB(),
                };
            }
        });

        this.updateBounds();
    }

    setAnimation(index) {
        if (index <= this._animations.length) {
            this._data.animationIndex = index;
            this._mixer.stopAllAction();
            this._currentAnimation = this._mixer.clipAction(
                this._animations[this._data.animationIndex]
            );
            this._currentAnimation
                .reset()
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .play();
        }
    }

    transitionAnimation(index, duration) {
        if (index <= this._animations.length) {
            this._currentAnimation.fadeOut(duration);
            this._currentAnimation = this._mixer.clipAction(
                this._animations[this._data.animationIndex]
            );
            this._currentAnimation
                .reset()
                .setEffectiveTimeScale(1)
                .setEffectiveWeight(1)
                .fadeIn(duration)
                .play();
        }
    }

    /**
     * Checks for collision between two bounding boxes. Checks all collisions in this mesh unless 'child' is defined.
     * @param {OBB} otherOBB The other OBB.
     * @param {string} child The name of the child in this mesh.
     * @returns {boolean} Collided
     */
    isColliding(otherOBB, child = undefined) {
        // Hacky solution to collisions spawning at 0, 0, 0 on the first frame.
        if (this._firstFrame) {
            this._firstFrame = false;

            return;
        }

        if (child === undefined) {
            for (const child in this._children) {
                const thisOBB = this._children[child].obb;

                if (thisOBB.intersectsOBB(otherOBB)) {
                    return true;
                }
            }
        } else {
            if (child in this._children) {
                const thisOBB = this._children[child].obb;

                if (thisOBB.intersectsOBB(otherOBB)) {
                    return true;
                }
            }
        }

        return false;
    }

    updateBounds() {
        for (const child in this._children) {
            this._children[child].obb
                .copy(this._children[child].geometry.userData.obb)
                .applyMatrix4(this._mesh.matrixWorld);
        }
    }

    getBounds(child) {
        if (child in this._children) {
            return this._children[child].geometry.boundingBox;
        }
    }

    getHelper(child) {
        if (child in this._children) {
            return this._children[child].helper;
        }
    }

    _destroy() {
        super._destroy();

        for (const child in this._children) {
            const geometry = this._children[child].geometry;
            const material = this._children[child].material;
            geometry.dispose();
            material.dispose();
        }

        this._root.remove(this._mesh);
    }

    _update(delta) {
        super._update(delta);

        if (this._mixer) {
            this._mixer.update(delta);
        }

        if (!this._static) {
            this.updateBounds();
        }
    }

    get children() {
        return this._children;
    }

    get bounds() {
        let bounds = [];

        for (const child in this._children) {
            bounds.push(this._children[child].geometry.boundingBox);
        }

        return bounds;
    }

    get helpers() {
        let helpers = [];

        for (const child in this._children) {
            helpers.push(this._children[child].helper);
        }

        return helpers;
    }

    get mesh() {
        return this._mesh;
    }

    get animations() {
        return this._animations;
    }

    get mixer() {
        return this._mixer;
    }
}
