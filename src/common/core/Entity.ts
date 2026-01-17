
export class Entity {
    entityId: number;
    components: any[] = [];
    constructor(id: number) {
        this.entityId = id;
    }
}