import { Server } from "socket.io";

export class SNet {
    server: Server;
    url = ""
    constructor(){
        this.server = new Server({
            transports: ["websocket"]
        });
    }
}