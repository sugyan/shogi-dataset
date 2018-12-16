import { labels, labelStringMap } from "./piece";
import { IpredictResult } from "./worker-proxy";

export interface Iparameter {
    [key: string]: string;
}

export const queryString: (params: Iparameter) => string = (params: Iparameter): string => {
    return Object.keys(params).map((key: string) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }).join("&");
};

export const predictResultString: (results: IpredictResult[]) => string = (results: IpredictResult[]): string => {
    const lines: string[] = results.map((p: IpredictResult) => {
        return `${labelStringMap[p.label as labels]}: ${Math.round(p.score * 10000) / 10000}`;
    });
    return lines.join("\n");
};
