import { io, Socket } from "socket.io-client"

export class CNet {
    url = location.hostname === "localhost"
        ? "ws://localhost:8080"
        : "wss://srv.solblade.online";
    socket: Socket;
    events: Map<string, any> = new Map();
    localServer: any | null = null;
    constructor() {
        this.socket = io(this.url, {
            transports: ["websocket"],
            autoConnect: false
        });
        this.socket.on("connect", () => {
            console.log('socket connected');
        })
        this.socket.onAny((event, ...args) => {
            const e = this.events.get(event);
            if (e) e(...args);
        })
    }
    connect() { this.socket.connect(); }
    on(event: any, handler: any) { this.events.set(event, handler) }
    emit(event: any, ...data: any) {
        if (this.socket.connected) {
            this.socket.emit(event, ...data);
        } else if (this.localServer) {
            this.localServer[event](data);
        }
    }
    async emitWithAck(event: any, ...args: any) {
        try {
            await this.socket.emitWithAck(event, ...args);
        } catch {
            console.warn("Failed to connect")
        }
    }
    async start() {
        try {
            this.socket.connect();
            const response = await this.socket.timeout(1000).emitWithAck("hello", "Hello World!!");
            console.log(response);
        }
        catch {
            // const { SGame } = await import("@solblade/server/core/SGame.js");
            // this.localServer = new SGame();
            // await this.localServer.start(false);
            console.log("fail emit with ack");
        }
    }
}