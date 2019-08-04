import { labels, labelStringMap } from "./piece";
import { PredictResult } from "./predictor";

interface Parameter {
    [key: string]: string;
}

export const queryString: (params: Parameter) => string = (params: Parameter): string => {
    return Object.keys(params).map((key: string): string => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }).join("&");
};

export const predictResultString: (results: PredictResult[]) => string = (results: PredictResult[]): string => {
    const lines: string[] = results.map((p: PredictResult): string => {
        return `${labelStringMap[p.label as labels]}: ${Math.round(p.score * 10000) / 10000}`;
    });
    return lines.join("\n");
};
