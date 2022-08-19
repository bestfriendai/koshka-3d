import { Cache, RepeatWrapping, RGBAFormat, sRGBEncoding } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Database } from "./database.js";
import { Settings } from "./settings.js";

export class ResourceManager {
    static _gltfLoader = undefined;
    static _objLoader = undefined;
    static _dracoLoader = undefined;
    static _loading = {
        resolved: 0,
        total: 0,
    };

    static async init() {
        Cache.enabled = true;
        this._gltfLoader = new GLTFLoader();
        this._objLoader = new OBJLoader();
        this._dracoLoader = new DRACOLoader();
        this._dracoLoader.setDecoderPath(`../res/draco/`);
        this._gltfLoader.setDRACOLoader(this._dracoLoader);
        let opacity = 100;

        return new Promise((resolve) => {
            const totalShaders = Object.keys(Database.shaders).length;
            const totalModels = Object.keys(Database.models).length;

            this._loading.total = totalShaders + totalModels;

            for (const shader in Database.shaders) {
                this.loadShader(
                    shader,
                    Database.shaders[shader].vertexPath,
                    Database.shaders[shader].fragmentPath
                );
            }

            for (const model in Database.models) {
                this.loadGLTF(model, Database.models[model].path);
            }

            const updateProgress = () => {
                const progress =
                    (this._loading.resolved / this._loading.total) * 100;
                const bar = document.getElementById(`progress-bar`);
                bar.style.width = `${Math.round(progress)}%`;

                console.log(`Loading: ${progress}%`);

                if (progress < 100) {
                    setTimeout(() => updateProgress(), 25);
                } else {
                    setTimeout(() => fadeProgress(), 1000);
                    resolve(`OK`);
                }
            };

            const fadeProgress = () => {
                const loading = document.getElementById(`loading`);
                opacity -= 1;
                loading.style.opacity = `${opacity}%`;

                if (opacity > 0) {
                    setTimeout(() => fadeProgress(), 10);
                }
            };

            updateProgress();
        });
    }

    static async loadShader(name, vertexPath, fragmentPath) {
        const vertexShader = await fetch(vertexPath);
        const vertexString = await vertexShader.text();
        Database.shaders[name].vertex = vertexString;
        const fragmentShader = await fetch(fragmentPath);
        const fragmentString = await fragmentShader.text();
        Database.shaders[name].fragment = fragmentString;

        if (name in Database.materials) {
            Database.materials[name].vertexShader = vertexString;
            Database.materials[name].fragmentShader = fragmentString;
        }

        this._loading.resolved += 1;

        console.log(`Loaded shader '${name}'.`);
    }

    static async loadGLTF(name, gltfPath) {
        this._gltfLoader.load(
            gltfPath,
            (gltf) => {
                const mesh = gltf.scene;

                mesh.traverse((child) => {
                    if (child.isSkinnedMesh) {
                        child.frustumCulled = false;
                    }

                    if (
                        child.name.match(`_bounds`) ||
                        child.name.match(`_col`)
                    ) {
                        if (child.material) {
                            child.material.dispose();
                        }

                        child.visible = false;
                    } else if (child.material && child.material.map) {
                        if (Settings.game.shader in Database.materials) {
                            const map = child.material.map;
                            map.format = RGBAFormat;
                            map.encoding = sRGBEncoding;
                            map.wrapS = RepeatWrapping;
                            map.wrapT = RepeatWrapping;

                            const newMaterial =
                                Database.materials[Settings.game.shader];
                            child.material = newMaterial.clone();

                            if (Settings.game.shader === `psx`) {
                                child.material.uniforms.uTexture.value =
                                    map.clone();
                            } else {
                                child.material.map = map.clone();
                            }
                        }
                    }
                });

                Database.models[name][`mesh`] = mesh;
                Database.models[name][`animations`] = gltf.animations;

                this._loading.resolved += 1;

                console.log(`Loaded model '${name}'.`);
            },
            (progress) => {
                //console.log(`Loading model '${name}' ${(progress.loaded / progress.total) * 100}%`);
            },
            (error) => {
                console.warn(`Failed to load '${name}' ${error}`);
            }
        );
    }
}
