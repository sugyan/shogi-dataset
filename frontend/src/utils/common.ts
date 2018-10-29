export interface Iparameter {
    [key: string]: string;
}

export const queryString: (params: Iparameter) => string = (params: Iparameter): string => {
    return Object.keys(params).map((key: string) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }).join("&");
};
