import { Vector3 } from "three";
import { Client } from "../client.js";
import { EntityManager } from "../entitymanager.js";
import { Map } from "../map.js";

export class MapDebug extends Map {
    constructor() {
        super();
        this._createEnvironment(`world`);
    }

    onClientJoinedRoom(id) {
        if (id === Client.id) {
            EntityManager.requestSpawn(`character`, {
                propID: "player",
                ownerID: Client.id,
                ownerIsPlayer: true,
                position: new Vector3(0, 2, 0),
            });
        }
    }
}
