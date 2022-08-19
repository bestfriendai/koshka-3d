import { io } from "socket.io-client";

export class Client {
    static _socket = undefined;
    static _room = undefined;
    static _clients = [];
    static _connected = false;

    static async connect(ip) {
        return new Promise((resolve) => {
            this._socket = io(ip);

            this._socket.on(`connect`, () => {
                this._connected = true;
                this._clients.push(this._socket.id);
                this._socket.emit(`ready`);

                this._socket.on(`clientConnected`, (id) => {
                    const msg =
                        id === this.id
                            ? `Connected to server.`
                            : `Client '${id}' connected.`;
                    console.log(msg);
                });

                this._socket.on(`clientDisconnected`, (id, clients) => {
                    this._clients = clients;
                    console.log(`Client '${id}' disconnected.`);
                });

                this._socket.on(`clientJoinedRoom`, (id, room, clients) => {
                    this._clients = clients;
                    let msg = `Client '${id}' joined your room '${room}'.`;

                    if (id === this.id) {
                        this._room = room;
                        msg = `You joined room '${room}'.`;
                    }

                    console.log(msg);

                    document.dispatchEvent(
                        new CustomEvent(`onClientJoinedRoom`, {
                            detail: {
                                id: id,
                                room: room,
                            },
                        })
                    );
                });

                this._socket.on(`clientLeftRoom`, (id, room, clients) => {
                    this._clients = clients;
                    let msg = `Client '${id}' left your room '${room}'.`;

                    if (id === this.id) {
                        this._room = `None`;
                        msg = `You left room '${room}'.`;
                    }

                    console.log(msg);

                    document.dispatchEvent(
                        new CustomEvent(`onClientLeftRoom`, {
                            detail: {
                                id: id,
                                room: room,
                            },
                        })
                    );
                });

                this._socket.on(`serverTick`, (data) => {
                    document.dispatchEvent(
                        new CustomEvent(`onServerTick`, {
                            detail: {
                                socket: this._socket,
                                data: data,
                            },
                        })
                    );
                });

                this._socket.on(`serverSpawn`, (args) => {
                    document.dispatchEvent(
                        new CustomEvent(`onServerSpawn`, {
                            detail: {
                                args: args,
                            },
                        })
                    );
                });

                this._socket.on(`serverDespawn`, (uniqueID) => {
                    document.dispatchEvent(
                        new CustomEvent(`onServerDespawn`, {
                            detail: {
                                uniqueID: uniqueID,
                            },
                        })
                    );
                });

                resolve(`OK`);
            });
        });
    }

    static get socket() {
        return this._socket;
    }

    static get room() {
        return this._room;
    }

    static get id() {
        return this._socket.id;
    }

    static get clients() {
        return this._clients;
    }

    static get connected() {
        return this._connected;
    }
}
