import { SolVec3 } from "#/common/core/SolMath";
import type { MovementComp } from "./MovementComp";

let horizVelocity = new SolVec3();

export function groundMove(dt: number, move: MovementComp, wishdir?: SolVec3) {
    let dir = wishdir ? wishdir : move.wishdir;
    friction(dt, move.velocity, move.friction);
    accelerate(dt, move.velocity, dir, move.speed * move.augmentSpeed, move.accel);
}

export function jump(comp: MovementComp, dt?: number) {
    const x = comp.velocity.x;
    const y = Math.max(comp.velocity.y, 10);
    const z = comp.velocity.z;
    comp.velocity.set(x, y, z);
}

function friction(dt: number, velocity: SolVec3, friction: number, exponential: boolean = true) {
    horizVelocity.copy(velocity);
    horizVelocity.y = 0;
    const speed = horizVelocity.length();
    if (speed < 0.00001) return;
    const drop = exponential ? speed * friction * dt : friction * dt;
    const newSpeed = Math.max(0, speed - drop);
    const cap = newSpeed / speed;
    horizVelocity.multiplyScalar(cap);
    horizVelocity.y = velocity.y;
    velocity.copy(horizVelocity);
}

function accelerate(dt: number, velocity: SolVec3, wishdir: SolVec3, wishspeed: number, accel: number) {
    const dirspeed = horizVelocity.dot(wishdir);
    const addspeed = wishspeed - dirspeed;
    if (addspeed <= 0) return;
    let accelSpeed = accel * wishspeed * dt;
    accelSpeed = Math.min(accelSpeed, addspeed);
    velocity.add(wishdir.multiplyScalar(accelSpeed));
}