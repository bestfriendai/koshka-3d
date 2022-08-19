import {
    Clock,
    Color,
    PerspectiveCamera,
    Scene,
    sRGBEncoding,
    Vector3,
    WebGLRenderer,
} from "three";
import { ResourceManager } from "./resourcemanager.js";
import { Client } from "./client.js";
import { InputManager } from "./inputmanager.js";
import { EntityManager } from "./entitymanager.js";
import { Settings } from "./settings.js";
import { Developer } from "./developer.js";
import { MapDebug } from "./maps/debug.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";

export class Engine {
    static _window = undefined;
    static _clock = new Clock();
    static _renderer = undefined;
    static _scene = undefined;
    static _camera = undefined;
    static _map = undefined;
    static _rapier = undefined;
    static _physicsWorld = undefined;
    static _stats = undefined;
    static _player = undefined;
    static _paused = true;

    static async init(canvas) {
        await Developer.init();
        await ResourceManager.init();
        await InputManager.init();
        await EntityManager.init();
        await this._initializeRapier();
        await this._initializeThree(canvas);
        await this._initializeMap();
        await Client.connect(Settings.client.serverIP);

        if (Settings.game.debug) {
            this._stats = new Stats();
            document.body.appendChild(this._stats.dom);
        }

        window.addEventListener(`resize`, () => this._onResize());
        this._mainLoop(this._clock.getDelta());
        this._paused = false;
    }

    static pause() {
        this._paused = true;
    }

    static unpause() {
        this._paused = false;
    }

    static changeLevel(map) {
        if (this._map) {
            this._map._destroy();
        }

        this._map = undefined;
        this._player = undefined;

        // TODO: Load into new map.
    }

    static setPlayer(entity) {
        this._player = entity;
    }

    static async _initializeRapier() {
        await RAPIER.init();
        this._rapier = RAPIER;
        const gravity = new Vector3(0, -9.81, 0);
        this._physicsWorld = new RAPIER.World(gravity);
    }

    static _initializeThree(canvas) {
        return new Promise((resolve) => {
            this._clock.start();
            this._renderer = new WebGLRenderer({
                canvas: canvas,
                antialias: false,
            });
            this._renderer.outputEncoding = sRGBEncoding;
            this._renderer.domElement.style.imageRendering = `pixelated`;
            this._renderer.domElement.imageSmoothingEnabled = false;
            this._setCanvas();
            this._scene = new Scene();
            this._scene.background = new Color(0x85d0ff);
            this._camera = new PerspectiveCamera(75, 16 / 9, 0.01, 3000);
            console.log(`Three ready.`);

            resolve(`OK`);
        });
    }

    static _initializeMap() {
        return new Promise((resolve) => {
            this._map = new MapDebug();
            console.log(`Map ready.`);

            resolve(`OK`);
        });
    }

    static _mainLoop(delta) {
        requestAnimationFrame(() => this._mainLoop(this._clock.getDelta()));

        if (!this._paused && this._map) {
            this._physicsWorld.step();
            this._map.update(delta);
            EntityManager.update(delta);
        }

        this._renderer.render(this._scene, this._camera);
        this._stats ? this._stats.update : null;
    }

    static _onResize() {
        this._setCanvas();
        this._camera.aspect =
            Settings.game.resolution[0] / Settings.game.resolution[1];
        this._camera.updateProjectionMatrix();
    }

    static _setCanvas() {
        this._renderer.setSize(
            Settings.game.resolution[0],
            Settings.game.resolution[1]
        );
        this._renderer.setPixelRatio(1);
        const height = window.innerHeight;
        const width = (height * 16) / 9;
        this._renderer.domElement.style.width = `${width}px`;
        this._renderer.domElement.style.height = `${height}px`;
        this._renderer.domElement.style.position = `absolute`;
        this._renderer.domElement.style.left = `50%`;
        this._renderer.domElement.style.marginLeft = `${-width / 2}px`;
    }

    static get clock() {
        return this._clock;
    }

    static get scene() {
        return this._scene;
    }

    static get entities() {
        return this._scene.children;
    }

    static get RAPIER() {
        return this._rapier;
    }

    static get physics() {
        return this._physicsWorld;
    }

    static get world() {
        return this._map;
    }

    static get camera() {
        return this._camera;
    }

    static get player() {
        return this._player;
    }

    static get paused() {
        return this._paused;
    }
}
