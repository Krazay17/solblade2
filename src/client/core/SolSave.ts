const CURRENT_VERSION = 0.01;

interface SaveData {
    version?: number;
    name?: string;
    mapIndex?: number;
    money?: number;
}

class SolSave implements SaveData {
    version: number = CURRENT_VERSION;
    name = "Player";
    password: string | null = null;
    mapIndex: number = 0;
    money = 100;
    save(newData: SaveData = {}) {
        const data = {
            version: newData.version ?? this.version,
            name: newData.name ?? this.name,
            mapIndex: newData.mapIndex ?? this.mapIndex,
            money: newData.money ?? this.money,
        }
        localStorage.setItem("SolSave", JSON.stringify(data))
        return data;
    }
    load() {
        const existingData = localStorage.getItem("SolSave");
        let data = existingData ? existingData : this.save();
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        if (parsed.version !== this.version) {
            const keep = {
                name: this.name,
            }
            this.reset(keep)
            return;
        }
        this.version = CURRENT_VERSION;
        this.name = parsed.name ?? this.name;
        this.mapIndex = parsed.mapIndex ?? this.mapIndex;
        this.money = parsed.money ?? this.money;
    }
    reset(keep) {
        this.version = 0;
        this.password = null;
        this.mapIndex = 0;
        this.money = 100;
        Object.assign(this, keep);
    }
}
const solSave = new SolSave();
solSave.load();
export default solSave;