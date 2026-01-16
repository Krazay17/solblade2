export class MovementComp {
    state = "idle";
    lastState = "idle";
    speed = 5;
    accel = 10;
    friction = 5;
    jumpHeight = 5;
    dashTime = 1;
    inputs = {
        moveDir: {
            x: 0,
            z: 0
        }
    }
}