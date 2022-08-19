import {
    DoubleSide,
    MeshLambertMaterial,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
} from "three";
import { Freecam } from "./entities/developer/freecam.js";
import { Entity } from "./entities/entity.js";
import { Prop } from "./entities/prop.js";
import { PhysicsProp } from "./entities/physicsprop.js";
import { Character } from "./entities/character.js";

export class Database {
    static maps = {
        debug: Map,
    };

    static entities = {
        entity: {
            class: Entity,
            args: {},
        },
        prop: {
            class: Prop,
            args: {},
        },
        physicsProp: {
            class: PhysicsProp,
            args: {},
        },
        character: {
            class: Character,
            args: {
                shapeType: `capsule`,
                kinematic: false,
                ignoreRotation: true,
                enabledRotations: new Vector3(0, 0, 0),
                linearDamping: 5,
                radius: 0.3,
                halfHeight: 2.5 / 2,
                offset: new Vector3(0, -(2.5 / 2) - 0.3, 0),
            },
        },
        freecam: {
            class: Freecam,
            args: {
                moveSpeed: 20,
            },
        },
    };

    static shaders = {
        psx: {
            vertexPath: `../res/shaders/psx/psx.vert`,
            fragmentPath: `../res/shaders/psx/psx.frag`,
            vertex: undefined,
            fragment: undefined,
        },
    };

    static models = {
        world: {
            path: `../res/models/plane.gltf`,
        },
        player: {
            path: `../res/models/player.gltf`,
        },
    };

    static materials = {
        psx: new ShaderMaterial({
            lights: true,
            fog: true,
            side: DoubleSide,
            transparent: false,
            alphaToCoverage: true,
            uniforms: UniformsUtils.merge([
                UniformsLib.lights,
                UniformsLib.fog,
                {
                    uTexture: {
                        value: undefined,
                    },
                    uRepeat: {
                        value: 1,
                    },
                    uTime: {
                        value: 0,
                    },
                    uTextureDepth: {
                        value: 5,
                    },
                    uResolution: {
                        value: new Vector3(160, 90),
                    },
                },
            ]),
            defines: {
                DITHERING: 1,
                QUANTIZE_TEXTURES: 1,
                AFFINE_MAPPING: 0,
            },
            vertexShader: undefined,
            fragmentShader: undefined,
        }),
        hl1: new MeshLambertMaterial({
            side: DoubleSide,
        }),
    };
}
