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
    const softmax: tf.Tensor = tf.tidy((): tf.Tensor => {
        const tensors: tf.Tensor[] = data.map((d: ImageData): tf.Tensor => tf.browser.fromPixels(d));
        const inputs: tf.Tensor = tf.stack(tensors).toFloat().div(tf.scalar(255.0));
        const logits: tf.Tensor = model.execute(inputs, "MobilenetV2/Logits/output") as tf.Tensor;
        return tf.softmax(logits);
    });
    const resultData: Float32Array = softmax.dataSync() as Float32Array;
    softmax.dispose();

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
    private modelData?: ModelData
    private static instance: Predictor;
    private static getInstance(): Predictor {
        if (!this.instance) {
            return Predictor.instance = new Predictor();
        }
        return Predictor.instance;
    }
    private constructor() {
    }
    private async loadModel(): Promise<ModelData> {
        const MODEL_URL = process.env.MODEL_URL || "/static/data/model.json";
        const model: tf.GraphModel = await tf.loadGraphModel(MODEL_URL);
        const labelsTensor: tf.Tensor = tf.tidy((): tf.Tensor => {
            return model.execute(tf.tensor([], [0, 96, 96, 3]), "labels") as tf.Tensor;
        });
        const labels: string[] = String.fromCharCode(...Array.from(labelsTensor.dataSync())).split(",");
        labelsTensor.dispose();
        return(this.modelData = { model, labels });
    }
}
