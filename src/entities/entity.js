import { Euler, Object3D, Quaternion, Vector3 } from "three";
import { Client } from "../client.js";
import { Database } from "../database.js";
import { Engine } from "../engine.js";
import { EntityManager } from "../entitymanager.js";
import { generateUUID, toDegrees } from "../lib/utils.js";

export class Entity {
    constructor(args) {
        this._data = {
            id: `entity`,
            uniqueID: generateUUID(),
            ownerID: 0,
            enabled: true,
            position: new Vector3(0, 0, 0),
            rotation: new Euler(0, 0, 0, `XYZ`),
            destroyOnOwnerLeave: true,
            ...Database.entities[args.id].args,
            ...args,
        };

        this._started = false;
        this._root = new Object3D();
        this._root.name = this._data.id;
        this._root.position.copy(this._data.position);
        this._root.rotation.copy(this._data.rotation);
        Engine.scene.add(this._root);
        EntityManager.registerEntity(this);
    }

    onStart() {}

    onEnable() {}

    onDisable() {}

    onDestroy() {}

    onUpdate() {}

    onTick() {}

    translate(x, y, z) {
        this._data.position.x += x;
        this._data.position.y += y;
        this._data.position.z += z;
    }

    rotate(x, y, z) {
        this._data.rotation.x += x;
        this._data.rotation.y += y;
        this._data.rotation.z += z;
    }

    setPosition(x, y, z) {
        this._data.position = new Vector3(x, y, z);
    }

    setRotation(x, y, z) {
        this._data.rotation = new Euler(x, y, z, `XYZ`);
    }

    log(msg, type = 1) {
        switch (type) {
            case 1:
                console.log(`[${this.constructor.name}] ${msg}`);

                break;

            case 2:
                console.warn(`[${this.constructor.name}] ${msg}`);

                break;

            case 3:
                console.error(`[${this.constructor.name}] ${msg}`);

                break;

            default:
                break;
        }
    }

    _destroy() {
        this.enabled = false;
        this.onDestroy();
        Engine.scene.remove(this._root);
    }

    _tick() {
        this.onTick();
    }

    _update(delta) {
        if (this._data.enabled) {
            if (!this._started) {
                this._started = true;
                this.onStart();
            }

            this.onUpdate();

            if (this.isNetworkOwner) {
                this._root.position.copy(this._data.position);
                this._root.rotation.copy(this._data.rotation);
            } else {
                this._root.position.lerp(this._data.position, delta * 10);
                let r = new Quaternion().setFromEuler(this._data.rotation);
                this._root.quaternion.slerp(r, delta * 10);
            }
        } else {
            return;
        }
    }

    get isNetworkOwner() {
        return (
            (Client.connected && Client.id == this._data.ownerID) ||
            this._data.ownerID === 0
        );
    }

    get isLocalOwner() {
        return this._data.ownerID === 0;
    }

    get enabled() {
        return this._data.enabled;
    }

    set enabled(enabled) {
        this._data.enabled = enabled;
        enabled ? this.onEnable() : this.onDisable();
    }

    get data() {
        return this._data;
    }

    set data(data) {
        this._data = data;
    }

    get rotationDegrees() {
        const x = toDegrees(this._data.position.x);
        const y = toDegrees(this._data.position.y);
        const z = toDegrees(this._data.position.z);

        return new Vector3(x, y, z);
    }

    get forward() {
        const dir = new Vector3();
        this._root.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        return dir;
    }

    get right() {
        const dir = new Vector3();
        this._root.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        dir.cross(this._root.up);

        return dir;
    }

    get up() {
        return new Vector3(0, 1, 0);
    }

    get root() {
        return this._root;
    }
}
