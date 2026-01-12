export interface ActorProps {
    body: BodyData;
    mesh?: string;
    abilities?: string[];
}

export interface BodyData {
    type: "pawn" | "capsule" | "box" | "ball" | "trimesh";
    radius: number;
    height: number;
    mass?: number;
    vertices?: Float32Array | number[];
    indices?: Uint32Array | number[];
    collisionGroup?: number;
    sensor?: boolean;
}

export const ActorTypes: Record<string, ActorProps> = {
    player: {
        body: {
            type: "pawn",
            radius: 0.5,
            height: 1,
        },
        mesh: "SpikeMan",
    },
    wizard: {
        body: {
            type: "pawn",
            radius: 0.5,
            height: 1,
        },
        mesh: "Wizard",
    },
    cube: {
        body: {
            type: "box",
            radius: 1,
            height: 1,
        },
        mesh: "Cube"
    }
}