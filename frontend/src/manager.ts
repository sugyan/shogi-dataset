import Worker from "./tf.worker";

const EVENT_MESSAGE = "message";

export interface IpredictResult {
    score: number;
    label: string;
}

interface Iresponse {
    key: string;
    results: IpredictResult[][];
}

export default class Manager {
    public static getInstance(): Manager {
        if (!this.instance) {
            Manager.instance = new Manager();
        }
        return Manager.instance;
    }
    private static instance: Manager;
    private emitter: EventTarget;
    private worker: Worker;
    private constructor() {
        this.emitter = new EventTarget();
        this.worker = new Worker();
        this.worker.addEventListener("message", this.onMessage.bind(this));
    }
    public predict(inputs: ImageData[]): Promise<IpredictResult[][]> {
        const key: string = Math.random().toString(36).slice(-8);
        return new Promise<IpredictResult[][]>((resolve) => {
            const listener = (ev: Event) => {
                const data: Iresponse = (ev as CustomEvent).detail;
                if (data.key === key) {
                    resolve(data.results);
                    this.emitter.removeEventListener(EVENT_MESSAGE, listener);
                }
            };
            this.emitter.addEventListener(EVENT_MESSAGE, listener);
            this.worker.postMessage({ key, inputs });
        });
    }
    private onMessage(ev: MessageEvent) {
        this.emitter.dispatchEvent(new CustomEvent(EVENT_MESSAGE, { detail: ev.data }));
    }
}
