import { Client } from "./client.js";
import { Engine } from "./engine.js";
import { EntityManager } from "./entitymanager.js";
import { Settings } from "./settings.js";

export class Developer {
    static _cornerDiv = undefined;
    static _cornerText = `Debug`;
    static _debugInfo = {
        Room: ``,
        Clients: 0,
        Entities: 0,
        SceneEntities: 0,
        RigidBodies: 0,
        Colliders: 0,
        Position: {
            x: 0,
            y: 0,
            z: 0,
        },
    };

    static async init() {
        return new Promise((resolve) => {
            if (Settings.game.debug) {
                this._cornerDiv = document.getElementById(`debug-corner-text`);
                this._cornerDiv.innerHTML = JSON.stringify(this._debugInfo);

                this._startInfoUpdater();
            }

            resolve(`OK`);
        });
    }

    static _startInfoUpdater() {
        const update = () => {
            this._debugInfo.Room = Client?.room;
            this._debugInfo.Clients = Client.clients?.length;
            this._debugInfo.Entities = Object.keys(
                EntityManager.entities
            )?.length;
            this._debugInfo.SceneEntities = Engine.scene?.children?.length;
            this._debugInfo.RigidBodies = Engine.physics?.bodies?.len();
            this._debugInfo.Colliders = Engine.physics?.colliders?.len();
            this._debugInfo.Position = Engine.player?.data.position;
            this._updateCornerText();
            setTimeout(update, 250);
        };

        update();
    }

    static _updateCornerText() {
        let text = ``;

        for (const key in this._debugInfo) {
            if (typeof this._debugInfo[key] === `object`) {
                text += `${key}:\n`;

                for (const key2 in this._debugInfo[key]) {
                    text += `-- ${key2}: ${this._debugInfo[key][key2]}\n`;
                }
            } else {
                text += `${key}: ${this._debugInfo[key]}\n`;
            }
        }

        this._cornerDiv.textContent = text;
    }
}
