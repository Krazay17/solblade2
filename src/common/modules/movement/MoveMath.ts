import { SolVec3 } from "@/common/core/SolMath";
import type { MovementComp } from "./MovementComp";
import { Actions } from "@/common/core/SolConstants";

let horizVelocity = new SolVec3();
let tempDir = new SolVec3();
let wishdir = new SolVec3();

export function move(dt: number, comp: MovementComp) {
    wishdir = calcDir(comp);

    friction(dt, comp.velocity, comp.friction);
    accelerate(dt, comp.velocity, wishdir, comp.speed, comp.accel);
}

export function jump(dt: number, comp: MovementComp){
    tempDir.set(0,20,0);
    comp.velocity = comp.velocity.add(tempDir);
}

function calcDir(comp: MovementComp) {
    tempDir.set(0, 0, 0);

    const fwd = comp.actionMap.get(Actions.FWD) ? 1 : 0;
    const bwd = comp.actionMap.get(Actions.BWD) ? 1 : 0;
    const left = comp.actionMap.get(Actions.LEFT) ? 1 : 0;
    const right = comp.actionMap.get(Actions.RIGHT) ? 1 : 0;

    const zInput = bwd - fwd;   // -1 is Forward
    const xInput = right - left; // 1 is Right

    if (zInput === 0 && xInput === 0) return tempDir;

    // 3. Rotate Direction by Yaw
    // We use Math.sin/cos to rotate our vector manually - it's faster and simpler
    const sin = Math.sin(comp.yaw);
    const cos = Math.cos(comp.yaw);

    // Standard 2D rotation formula applied to X and Z
    const worldX = xInput * cos + zInput * sin;
    const worldZ = zInput * cos - xInput * sin;

    tempDir.set(worldX, 0, worldZ).normalize();

    return tempDir;
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