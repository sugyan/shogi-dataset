import * as tf from "@tensorflow/tfjs";
import { loadFrozenModel } from "@tensorflow/tfjs-converter";

interface Iscored {
    index: number;
    score: number;
}

interface Irequest {
    key: string;
    inputs: ImageData[];
}

const ctx: Worker = self as any;
const MODEL_URL = `${process.env.MODEL_URL_BASE}/tensorflowjs_model.pb`;
const WEIGHTS_URL = `${process.env.MODEL_URL_BASE}/weights_manifest.json`;

const inputQueue: Irequest[] = [];

const preloaded = (ev: MessageEvent) => {
    inputQueue.push(ev.data);
};
ctx.addEventListener("message", preloaded);

loadFrozenModel(
    MODEL_URL, WEIGHTS_URL,
).then((model: tf.FrozenModel) => {
    const labelsTensor: tf.Tensor = tf.tidy(() => {
        return model.execute(tf.tensor([], [0, 96, 96, 3]), "labels") as tf.Tensor;
    });
    const labels: string[] = String.fromCharCode(...labelsTensor.dataSync()).split(",");
    labelsTensor.dispose();

    const process = (request: Irequest) => {
        const data: ImageData[] = request.inputs;
        // calcurate softmax
        const softmax: tf.Tensor = tf.tidy(() => {
            const tensors: tf.Tensor[] = data.map((d: ImageData) => tf.fromPixels(d));
            const inputs: tf.Tensor = tf.stack(tensors).toFloat().div(tf.scalar(255.0));
            const logits: tf.Tensor = model.execute(inputs, "MobilenetV2/Logits/output") as tf.Tensor;
            return tf.softmax(logits);
        });
        const resultData: Float32Array = softmax.dataSync() as Float32Array;
        softmax.dispose();

        // sort and get top-k
        const results = [];
        for (let i: number = 0; i < resultData.length / labels.length; i++) {
            const values: Iscored[] = [];
            resultData.slice(labels.length * i, labels.length * (i + 1)).forEach((score: number, index: number) => {
                values.push({ index, score });
            });
            values.sort((a: Iscored, b: Iscored) => b.score - a.score);
            results.push(values.slice(0, 3).map((value: Iscored) => {
                const label: string = labels[value.index];
                return { score: value.score, label };
            }));
        }
        ctx.postMessage({ key: request.key, results });
    };
    inputQueue.forEach((value: Irequest) => {
        process(value);
    });
    ctx.addEventListener("message", (message: MessageEvent) => process(message.data) );
    ctx.removeEventListener("message", preloaded);
});

export default null as any;
