import { Server } from "socket.io";
import { SGame } from "./SGame";
import http from "http";

const SERVER_VERSION = 1.14;
const server = http.createServer();
const PORT = 8080;
const origin = ["http://localhost:5173"];

const io = new Server(server, {
    cors: { origin, methods: ["GET", "POST"] },
    connectTimeout: 5000,
    pingInterval: 5000,
    pingTimeout: 10000,
    cleanupEmptyChildNamespaces: true,
});
io.on("connection", (socket) => {
    socket.on("hello", (arg1, callback) => {
        console.log(arg1);
        callback('welcome')
    });
})
const game = new SGame();
game.run();

server.listen(PORT, ()=>{
    console.log(`Server listening on port: ${PORT}`);
});