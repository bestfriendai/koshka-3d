import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    DirectionalLightHelper,
} from "three";
import { Client } from "./client.js";
import { Engine } from "./engine.js";
import { EntityManager } from "./entitymanager.js";
import { Settings } from "./settings.js";
import { Skybox } from "./skybox.js";

export class Map {
    constructor() {
        this._environment = undefined;
        this._rigidBodies = [];
        this._colliders = [];
        this._skybox = new Skybox();
        this._ambientLight = new AmbientLight(0xffffff, 0.5);
        this._sun = new DirectionalLight(0xffffff, 1);
        this._sun.position.set(-10, 100, -10);
        this._sun.lookAt(0, 0, 0);
        this._axesHelper = new AxesHelper();
        this._sunHelper = new DirectionalLightHelper(this._sun);
        this._axesHelper.visible = this._sunHelper.visible = Settings.game.debug
            ? true
            : false;
        Engine.scene.add(
            this._ambientLight,
            this._sun,
            this._axesHelper,
            this._sunHelper
        );
        document.addEventListener(`onClientJoinedRoom`, (e) =>
            this.onClientJoinedRoom(e.detail.id, e.detail.room)
        );
        document.addEventListener(`onClientLeftRoom`, (e) =>
            this.onClientLeftRoom(e.detail.id, e.detail.room)
        );
    }

    _destroy() {
        Engine.pause();

        Engine.physics.forEachRigidBody((rigidBody) => {
            Engine.physics.removeRigidBody(rigidBody);
        });

        Engine.physics.forEachCollider((collider) => {
            Engine.physics.removeCollider(collider);
        });

        this._ambientLight.dispose();
        this._sun.dispose();
        this._axesHelper.dispose();
        this._sunHelper.dispose();
        Engine.unpause();
        Client.socket.emit(`requestJoinRoom`, `lobby`);
    }

    _createEnvironment(propID) {
        this._environment = EntityManager.spawnEntity(`prop`, {
            propID: propID,
            static: true,
        });

        this._environment.mesh.traverse((child) => {
            if (child.geometry) {
                const RAPIER = Engine.RAPIER;
                const world = Engine.physics;
                const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
                const verticesF32 = new Float32Array(
                    child.geometry.attributes.position.array
                );
                const indicesU32 = new Uint32Array(child.geometry.index.array);
                const colliderDesc = RAPIER.ColliderDesc.trimesh(
                    verticesF32,
                    indicesU32
                );
                world.createCollider(colliderDesc, rigidBodyDesc);
                this._rigidBodies.push(rigidBodyDesc);
                this._colliders.push(colliderDesc);
            }
        });
    }

    update(delta) {}

    onClientJoinedRoom(id, room) {}

    onClientLeftRoom(id, room) {}
}
