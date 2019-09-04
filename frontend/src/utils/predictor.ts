import * as tf from "@tensorflow/tfjs";

export interface PredictResult {
    score: number;
    label: string;
}

interface ModelData {
    model: tf.GraphModel;
    labels: string[];
}

interface Scored {
    index: number;
    score: number;
}

function calcResults(model: tf.GraphModel, labels: string[], data: ImageData[]): PredictResult[][] {
    // calcurate softmax
    const predict: tf.Tensor = tf.tidy((): tf.Tensor => {
        const tensors: tf.Tensor[] = data.map((d: ImageData): tf.Tensor => tf.browser.fromPixels(d));
        const inputs: tf.Tensor = tf.stack(tensors).toFloat().div(tf.scalar(255.0));
        return model.predict(inputs) as tf.Tensor;
    });
    const resultData: Float32Array = predict.dataSync() as Float32Array;
    predict.dispose();

    // sort and get top-k
    const results = [];
    for (let i = 0; i < resultData.length / labels.length; i++) {
        const values: Scored[] = [];
        resultData.slice(labels.length * i, labels.length * (i + 1)).forEach((score: number, index: number): void => {
            values.push({ index, score });
        });
        values.sort((a: Scored, b: Scored): number => b.score - a.score);
        results.push(values.slice(0, 3).map((value: Scored): PredictResult => {
            const label: string = labels[value.index];
            return { score: value.score, label };
        }));
    }
    return results;
}

export class Predictor {
    private modelData?: ModelData
    private static instance: Predictor;

    public static predict(inputs: ImageData[]): Promise<PredictResult[][]> {
        return Predictor.getInstance().predict(inputs);
    }
    private async predict(inputs: ImageData[]): Promise<PredictResult[][]> {
        if (this.modelData) {
            return calcResults(this.modelData.model, this.modelData.labels, inputs);
        } else {
            const data: ModelData = await this.loadModel();
            return calcResults(data.model, data.labels, inputs);
        }
    }
    private static getInstance(): Predictor {
        if (!this.instance) {
            return Predictor.instance = new Predictor();
        }
        return Predictor.instance;
    }
    private constructor() {
    }
    private async loadModel(): Promise<ModelData> {
        const MODEL_URL_BASE = process.env.REACT_APP_MODEL_URL_BASE || "/data";
        const MODEL_URL = `${MODEL_URL_BASE}/model.json`;
        const LABELS_URL = `${MODEL_URL_BASE}/labels.txt`;
        const labels = (await fetch(LABELS_URL).then((res: Response): Promise<string> => {
            if (res.ok) {
                return res.text();
            } else {
                throw new Error(res.statusText);
            }
        })).trim().split("\n");
        const model: tf.GraphModel = await tf.loadGraphModel(MODEL_URL);
        return (this.modelData = { model, labels });
    }
}
