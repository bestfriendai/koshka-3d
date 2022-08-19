export class Settings {
    static game = {
        debug: true,
        debugDrawBounds: false,
        shader: `psx`,
        resolution: [800, 450],
    };

    static client = {
        serverIP: `ws://localhost:8080`,
    };

    static server = {
        tickrate: 8,
        cleanTime: 10000,
    };
}
