export class SolVec3 {
    x: number = 0;
    y: number = 0;
    z: number = 0;

    constructor(x?: number | Record<string, number>, y?: number, z?: number) {
        if (typeof x === "object") {
            this.x = x.x ?? 0;
            this.y = x.y ?? 0;
            this.z = x.z ?? 0;
        } else {
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.z = z ?? 0;
        }
    }

    // Static method: creates a NEW instance
    static add(a: SolVec3, b: SolVec3): SolVec3 {
        return new SolVec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    // Mutates the instance and returns 'this' for chaining
    add(v: SolVec3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    normalize(): this {
        const mag = this.length();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
            this.z /= mag;
        }
        return this;
    }

    applyQuaternion(q: { x: number, y: number, z: number, w: number }): this {
        const vx = this.x, vy = this.y, vz = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        // Calculate (quaternion * vector)
        const ix = qw * vx + qy * vz - qz * vy;
        const iy = qw * vy + qz * vx - qx * vz;
        const iz = qw * vz + qx * vy - qy * vx;
        const iw = -qx * vx - qy * vy - qz * vz;

        // Calculate (result * inverse_quaternion)
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return this;
    }

    dot(v: SolVec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }

    static mag(v: SolVec3 | any): number {
        if (!v.x || !v.y || !v.z) return 0;
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    lengthSq(): number {
        return this.x ** 2 + this.y ** 2 + this.z ** 2;
    }

    angleTo(v: SolVec3): number {
        const dot = this.dot(v);
        const mag = this.length() * v.length();
        return Math.acos(dot / mag);
    }

    subtract(v: SolVec3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    multiplyScalar(v: number) {
        this.x *= v;
        this.y *= v;
        this.z *= v;
        return this;
    }

    copy(v: SolVec3 | any): this {
        this.x = v.x ?? 0;
        this.y = v.y ?? 0;
        this.z = v.z ?? 0;
        return this;
    }

    clone(): SolVec3 {
        return new SolVec3(this.x, this.y, this.z);
    }
}

export class SolQuat {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    w: number = 1;

    constructor(x?: number | Record<string, number>, y?: number, z?: number, w?: number) {
        if (typeof x === "object") {
            this.x = x.x ?? 0;
            this.y = x.y ?? 0;
            this.z = x.z ?? 0;
            this.w = x.w ?? 1;
        } else {
            this.x = x ?? 0;
            this.y = y ?? 0;
            this.z = z ?? 0;
            this.w = w ?? 1;
        }
    }

    // Static method: creates a NEW instance (Concatenates rotations A then B)
    static multiply(a: SolQuat, b: SolQuat): SolQuat {
        return new SolQuat(
            a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
            a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
            a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
            a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
        );
    }

    // Mutates the instance and returns 'this' (Concatenates another rotation onto this one)
    multiply(q: SolQuat): this {
        const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
        const qbx = q.x, qby = q.y, qbz = q.z, qbw = q.w;

        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return this;
    }

    set(x: number, y: number, z: number, w: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2);
    }

    normalize(): this {
        let l = this.length();
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }

    copy(q: SolQuat | any): this {
        this.x = q.x ?? 0;
        this.y = q.y ?? 0;
        this.z = q.z ?? 0;
        this.w = q.w ?? 1;
        return this;
    }

    static applyYaw(q: SolQuat, yaw: number): SolQuat {
        const y = Math.sin(yaw / 2);
        const w = Math.cos(yaw / 2);

        q.set(q.x, y, q.z, w);
        return q;
    }

    applyYaw(yaw: number): this {
        const y = Math.sin(yaw / 2);
        const w = Math.cos(yaw / 2);

        this.set(this.x, y, this.z, w);
        return this;
    }

    setFromEuler(pitch: number, yaw: number, roll: number, order = 'YXZ'): this {
        const c1 = Math.cos(pitch / 2);
        const c2 = Math.cos(yaw / 2);
        const c3 = Math.cos(roll / 2);

        const s1 = Math.sin(pitch / 2);
        const s2 = Math.sin(yaw / 2);
        const s3 = Math.sin(roll / 2);

        if (order === 'YXZ') {
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
        } else {
            // Default XYZ if needed
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 + s1 * s2 * c3;
            this.w = c1 * c2 * c3 - s1 * s2 * s3;
        }

        return this;
    }

    static slerpQuats(qa: SolQuat, qb: SolQuat, t: number, out?: SolQuat): SolQuat {
        const result = out || new SolQuat().copy(qa);

        // If t is 0, we are at qa
        if (t === 0) return result;
        // If t is 1, we are at qb
        if (t === 1) return result.copy(qb);

        let x = qa.x, y = qa.y, z = qa.z, w = qa.w;
        let bx = qb.x, by = qb.y, bz = qb.z, bw = qb.w;

        // Calculate the "distance" (dot product) between quaternions
        let cosHalfTheta = w * bw + x * bx + y * by + z * bz;

        // If the dot product is negative, slerp will take the long way around.
        // We flip one quaternion to take the shortest path.
        if (cosHalfTheta < 0) {
            result.set(-bx, -by, -bz, -bw);
            cosHalfTheta = -cosHalfTheta;
        } else {
            result.copy(qb);
        }

        // If they are basically the same, just do a linear interpolation to save math
        if (cosHalfTheta >= 1.0) {
            result.set(x, y, z, w);
            return result;
        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        // Fallback to lerp if the angle is too small for trig
        if (sqrSinHalfTheta <= Number.EPSILON) {
            const s = 1 - t;
            result.w = s * w + t * result.w;
            result.x = s * x + t * result.x;
            result.y = s * y + t * result.y;
            result.z = s * z + t * result.z;
            return result.normalize();
        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        result.w = (w * ratioA + result.w * ratioB);
        result.x = (x * ratioA + result.x * ratioB);
        result.y = (y * ratioA + result.y * ratioB);
        result.z = (z * ratioA + result.z * ratioB);

        return result;
    }

    slerp(qb: SolQuat, t: number): this {
        if (t === 0) return this;
        if (t === 1) return this.copy(qb);

        const x = this.x, y = this.y, z = this.z, w = this.w;

        let cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

        if (cosHalfTheta < 0) {
            this.w = -qb.w; this.x = -qb.x; this.y = -qb.y; this.z = -qb.z;
            cosHalfTheta = -cosHalfTheta;
        } else {
            this.copy(qb);
        }

        if (cosHalfTheta >= 1.0) {
            this.w = w; this.x = x; this.y = y; this.z = z;
            return this;
        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
        if (sqrSinHalfTheta <= Number.EPSILON) {
            const s = 1 - t;
            this.w = s * w + t * this.w;
            this.x = s * x + t * this.x;
            this.y = s * y + t * this.y;
            this.z = s * z + t * this.z;
            return this.normalize();
        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        this.w = (w * ratioA + this.w * ratioB);
        this.x = (x * ratioA + this.x * ratioB);
        this.y = (y * ratioA + this.y * ratioB);
        this.z = (z * ratioA + this.z * ratioB);

        return this;
    }

    identity(): this {
        return this.set(0, 0, 0, 1);
    }
}