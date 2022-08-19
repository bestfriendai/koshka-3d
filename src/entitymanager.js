import { Client } from "./client.js";
import { Database } from "./database.js";
import { Engine } from "./engine.js";

export class EntityManager {
    static _entities = {};

    static async init() {
        return new Promise((resolve) => {
            document.addEventListener(`onClientJoinedRoom`, (e) =>
                this.onClientJoinedRoom(e.detail.id, e.detail.room)
            );
            document.addEventListener(`onClientLeftRoom`, (e) =>
                this.onClientLeftRoom(e.detail.id, e.detail.room)
            );
            document.addEventListener(`onServerLoadWorld`, (e) =>
                this.onLoadWorld(e.detail.room, e.detail.entities)
            );
            document.addEventListener(`onServerTick`, (e) =>
                this.onServerTick(e.detail.socket, e.detail.data)
            );
            document.addEventListener(`onServerSpawn`, (e) =>
                this.spawnEntity(e.detail.args.id, e.detail.args)
            );
            document.addEventListener(`onServerDespawn`, (e) =>
                this.destroyEntity(e.detail.uniqueID)
            );

            resolve(`OK`);
        });
    }

    static registerEntity(entity) {
        this._entities[entity.data.uniqueID] = entity;
    }

    static spawnEntity(id, args = undefined) {
        if (id in Database.entities) {
            if (args === undefined) {
                args = {
                    id: id,
                    ...Database.entities[id].args,
                };
            } else {
                args = {
                    id: id,
                    ...Database.entities[id].args,
                    ...args,
                };
            }

            const object = Database.entities[id].class;
            const entity = new object(args);

            document.dispatchEvent(
                new CustomEvent(`onSpawnEntity`, {
                    detail: {
                        id: id,
                    },
                })
            );

            return entity;
        }

        console.error(`Failed to spawn '${id}', doesn't exist.`);

        return undefined;
    }

    static requestSpawn(id, args) {
        Client.socket.emit(`requestSpawn`, id, args);
    }

    static destroyEntity(uniqueID) {
        const ent = this._entities[uniqueID];
        delete this._entities[uniqueID];

        if (ent) {
            ent._destroy();
        }
    }

    static destroyEverything() {
        for (const uniqueID in this._entities) {
            this.destroyEntity(uniqueID);
        }

        this._entities = {};
    }

    static getEntity(uniqueID) {
        if (uniqueID in this._entities) {
            return this._entities[uniqueID];
        }
    }

    static getEntities() {
        let entities = [];

        for (const uniqueID in this._entities) {
            const ent = this._entities[uniqueID];
            entities.push(ent);
        }

        return entities;
    }

    static getEntitiesOfType(type) {
        let entities = [];

        for (const uniqueID in this._entities) {
            const ent = this._entities[uniqueID];

            if (ent.constructor.name === type) {
                entities.push(ent);
            }
        }

        return entities;
    }

    static onClientJoinedRoom(id, room) {}

    static onClientLeftRoom(id, room) {
        if (Client.id === id) {
            this.destroyEverything();
        }
    }

    static onServerTick(socket, data) {
        if (Engine.paused || data.room !== Client.room) {
            return;
        }

        for (const uniqueID of data.destroyQueue) {
            this.destroyEntity(uniqueID);
        }

        let dataPool = {};

        for (const uniqueID in data.entities) {
            const entity = this._entities[uniqueID];

            if (entity) {
                entity._tick();
            } else {
                const args = data.entities[uniqueID];
                this.spawnEntity(args.id, args);
            }

            if (entity !== undefined) {
                if (entity.isNetworkOwner) {
                    dataPool[uniqueID] = entity.data;
                } else {
                    const newData = data.entities[uniqueID];

                    if (uniqueID in this._entities) {
                        this._entities[uniqueID].data = newData;
                    }
                }
            }
        }

        if (Object.keys(dataPool).length > 0) {
            socket.volatile.emit(`tickResponse`, dataPool);
        }
    }

    static update(delta) {
        for (const entity in this._entities) {
            this._entities[entity]._update(delta);
        }
    }

    static get entities() {
        return this._entities;
    }
}
