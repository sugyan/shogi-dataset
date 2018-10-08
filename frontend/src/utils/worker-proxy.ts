import Worker from "./worker";

export interface IpredictResult {
    score: number;
    label: string;
}

interface Iresponse {
    key: string;
    results: IpredictResult[][];
}

export default class WorkerProxy {
    public static predict(inputs: ImageData[]): Promise<IpredictResult[][]> {
        const worker: Worker = WorkerProxy.getInstance().worker;
        const key: string = Math.random().toString(36).slice(-8);
        return new Promise<IpredictResult[][]>((resolve) => {
            const listener = (ev: MessageEvent) => {
                const data: Iresponse = ev.data;
                if (data.key === key) {
                    resolve(data.results);
                    worker.removeEventListener("message", listener);
                }
            };
            worker.addEventListener("message", listener);
            worker.postMessage({ key, inputs });
        });
    }
    private static instance: WorkerProxy;
    private static getInstance(): WorkerProxy {
        if (!this.instance) {
            WorkerProxy.instance = new WorkerProxy();
        }
        return WorkerProxy.instance;
    }
    private worker: Worker;
    private constructor() {
        this.worker = new Worker();
    }
}
