import { SolVec3 } from "@/common/core/SolMath";
import type { MovementComp } from "./MovementComp";

let velocity = new SolVec3();
let horizVelocity = new SolVec3();
let wishdir = new SolVec3();

export function move(dt: number, comp: MovementComp) {
    // wishdir.copy(comp!.inputs.moveDir);
    // velocity.copy(actor.body!.linvel());
    // horizVelocity.copy(velocity);
    // horizVelocity.y = 0;

    // friction(dt, comp.friction);
    // accelerate(dt, wishdir, comp.speed, comp.accel);

    // actor.body!.setLinvel(velocity, true);
}

function friction(dt: number, friction: number, exponential: boolean = true) {
    const speed = horizVelocity.length();
    if (speed < 0.00001) return;
    const drop = exponential ? speed * friction * dt : friction * dt;
    const newSpeed = Math.max(0, speed - drop);
    const cap = newSpeed / speed;
    horizVelocity.multiplyScalar(cap);
    horizVelocity.y = velocity.y;
    velocity.copy(horizVelocity);
}

function accelerate(dt: number, wishdir: SolVec3, wishspeed: number, accel: number) {
    const dirspeed = horizVelocity.dot(wishdir);
    const addspeed = wishspeed - dirspeed;
    if (addspeed <= 0) return;
    let accelSpeed = accel * wishspeed * dt;
    accelSpeed = Math.min(accelSpeed, addspeed);
    velocity.add(wishdir.multiplyScalar(accelSpeed));
}