import * as HTTP from "http";
import * as SOCKET from "socket.io";
import { Settings } from "../settings.js";
import { generateUUID } from "../lib/utils.js";

class GameServer {
    constructor() {
        this.httpServer = undefined;
        this.io = undefined;
        this.data = {
            clock: 0,
            rooms: {
                lobby: {
                    room: `lobby`,
                    clients: [],
                    entities: {},
                    destroyQueue: [],
                },
            },
        };
    }

    startServer() {
        this.createServer();
    }

    createServer() {
        this.httpServer = HTTP.createServer();
        this.io = new SOCKET.Server(this.httpServer, {
            cors: {
                origin: `*`,
            },
        });

        this.httpServer.listen(8080, () => {
            console.log(`Listening on 'http://localhost:8080/'.`);
        });

        this.startServerClock();

        this.io.on(`connection`, (socket) => {
            this.onClientConnect(socket);
            socket.on(`disconnect`, () => this.onClientDisconnect(socket));
            socket.on(`ready`, () => this.onClientReady(socket));
            socket.on(`requestJoinRoom`, (room) =>
                this.onClientRequestJoinRoom(socket, room)
            );
            socket.on(`requestSpawn`, (id, args) =>
                this.onClientRequestSpawn(socket, id, args)
            );
            socket.on(`tickResponse`, (dataPool) =>
                this.onClientTickResponse(socket, dataPool)
            );
        });
    }

    createEntity(room, args) {
        const uniqueID = generateUUID();

        if (!(room in this.data.rooms)) {
            this.createRoom(room);
        }

        args.uniqueID = uniqueID;
        args.destroyOnOwnerLeave = args.destroyOnOwnerLeave
            ? args.destroyOnOwnerLeave
            : true;
        this.data.rooms[room].entities[uniqueID] = args;

        return args;
    }

    destroyEntity(room, uniqueID) {
        delete this.data.rooms[room].entities[uniqueID];
    }

    addToDestroyQueue(room, uniqueID) {
        this.data.rooms[room].destroyQueue.push(uniqueID);
    }

    /**
     * Finds entities that are owned by the client and destroys them if 'destroyOnOwnerLeave' is true.
     * @param {Socket} socket
     * @param {string} room
     */
    handleDestroyOnLeave(socket, room) {
        if (room in this.data.rooms) {
            let total = 0;

            Object.keys(this.data.rooms[room].entities).forEach((uniqueID) => {
                const ownerID =
                    this.data.rooms[room].entities[uniqueID].ownerID;
                const destroyOnOwnerLeave =
                    this.data.rooms[room].entities[uniqueID]
                        .destroyOnOwnerLeave;

                if (destroyOnOwnerLeave && socket.id == ownerID) {
                    ++total;
                    delete this.data.rooms[room].entities[uniqueID];
                    this.addToDestroyQueue(room, uniqueID);
                }
            });

            console.log(`Cleaned up ${total} entities.`);
        }
    }

    /**
     * Gets the client's room.
     * @param {Socket} socket
     * @returns {string} room
     */
    getClientRoom(socket) {
        let room = undefined;
        socket.rooms.forEach((existingRoom) => {
            if (existingRoom != socket.id) {
                room = existingRoom;
            }
        });

        if (room === undefined) {
            for (const existingRoom in this.data.rooms) {
                for (const clientID of this.data.rooms[existingRoom].clients) {
                    if (clientID == socket.id) {
                        room = existingRoom;
                    }
                }
            }
        }

        return room;
    }

    /**
     * Creates a new room.
     * @param {string} room
     */
    createRoom(room) {
        this.data.rooms[room] = {
            room: room,
            clients: [],
            entities: {},
            destroyQueue: [],
        };
    }

    /**
     * Removes the client from the defined room.
     * @param {Socket} socket
     * @param {string} room
     * @returns
     */
    leaveRoom(socket, room) {
        if (!(room in this.data.rooms)) {
            return;
        }

        const index = this.data.rooms[room].clients.indexOf(socket.id);

        if (index > -1) {
            this.data.rooms[room].clients.splice(index, 1);
        }

        this.io
            .to(room)
            .emit(
                `clientLeftRoom`,
                socket.id,
                room,
                this.data.rooms[room].clients
            );
        socket.leave(room);
        console.log(`Client '${socket.id}' left room '${room}'.`);
        this.handleDestroyOnLeave(socket, room);
    }

    /**
     * Removes the client from their current room.
     * @param {Socket} socket
     */
    leaveCurrentRoom(socket) {
        this.leaveRoom(socket, this.getClientRoom(socket));
    }

    /**
     * Removes the client from their current room and moves them to the defined one.
     * @param {Socket} socket
     * @param {string} room
     */
    joinRoom(socket, room) {
        this.leaveCurrentRoom(socket);
        socket.join(room);

        if (!(room in this.data.rooms)) {
            this.createRoom(room);
        }

        this.data.rooms[room].clients.push(socket.id);
        this.io
            .to(room)
            .emit(
                `clientJoinedRoom`,
                socket.id,
                room,
                this.data.rooms[room].clients
            );
        console.log(`Client '${socket.id}' joined room '${room}'.`);
    }

    /**
     * Starts the server clock and sends 'ticks' to clients with room data.
     */
    startServerClock() {
        console.log(
            `Started server clock, Tickrate: ${Settings.server.tickrate}`
        );

        const tick = () => {
            for (const room in this.data.rooms) {
                this.io
                    .to(room)
                    .volatile.emit(`serverTick`, this.data.rooms[room]);
            }

            setTimeout(() => tick(), (1 / Settings.server.tickrate) * 1000);
        };

        tick();

        const cleanup = () => {
            for (const room in this.data.rooms) {
                if (this.data.rooms[room].destroyQueue.length > 0) {
                    this.data.rooms[room].destroyQueue = [];
                }
            }

            setTimeout(() => cleanup(), Settings.server.cleanTime);
        };

        cleanup();
    }

    /**
     * Called when a client connects.
     * @param {Socket} socket
     */
    onClientConnect(socket) {
        console.log(`Client '${socket.id}' connected.`);
        this.io.emit(`clientConnected`, socket.id);
    }

    /**
     * Called when a client disconnects.
     * @param {Socket} socket
     */
    onClientDisconnect(socket) {
        console.log(`Client '${socket.id}' disconnected.`);
        const room = this.getClientRoom(socket);
        this.leaveRoom(socket, room);

        if (room in this.data.rooms) {
            this.io
                .to(room)
                .emit(
                    `clientDisconnected`,
                    socket.id,
                    this.data.rooms[room].clients
                );
        }
    }

    /**
     * Called when a client has finished initializing.
     * @param {Socket} socket
     */
    onClientReady(socket) {
        console.log(`Client '${socket.id}' is ready.`);
        this.joinRoom(socket, `lobby`);
    }

    /**
     * Called when a client requests to join a room.
     * @param {Socket} socket
     * @param {string} room
     */
    onClientRequestJoinRoom(socket, room) {
        console.log(
            `Client '${socket.id}' is requesting to join room '${room}'.`
        );
        this.joinRoom(socket, room);
    }

    /**
     * Called when a client requests a server-wide entity spawn.
     * @param {Socket} socket
     * @param {string} id
     * @param {*} args
     */
    onClientRequestSpawn(socket, id, args) {
        console.log(`Client '${socket.id}' is requesting to spawn '${id}'.`);
        args.id = id;

        if (args.ownerID === undefined) {
            args.ownerID = socket.id;
        }

        const room = this.getClientRoom(socket);
        this.createEntity(room, args);
    }

    /**
     * Called when a client requests a server-wide entity despawn.
     * @param {Socket} socket
     * @param {string} uniqueID
     */
    onClientRequestDespawn(socket, uniqueID) {
        console.log(
            `Client '${socket.id}' is requesting to despawn '${uniqueID}'.`
        );
        const room = this.getClientRoom(socket);
        this.destroyEntity(room, uniqueID);
        this.addToDestroyQueue(room, uniqueID);
    }

    /**
     * Called when a client responds to a server tick.
     * @param {Socket} socket
     * @param {*} dataPool
     */
    onClientTickResponse(socket, dataPool) {
        const room = this.getClientRoom(socket);
        const entities = this.data.rooms[room].entities;

        for (const uniqueID in dataPool) {
            this.data.rooms[room].entities[uniqueID] = Object.assign(
                entities[uniqueID],
                dataPool[uniqueID]
            );
        }
    }
}

const server = new GameServer();
server.startServer();
