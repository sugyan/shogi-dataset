import { Action } from "redux";

export enum ActionName {
    UPDATE_POINTS  = "UPDATE_POINTS",
    LOAD_IMAGE     = "LOAD_IMAGE",
    SELECT_EXAMPLE = "SELECT_EXAMPLE",
}

export interface IupdatePointAction extends Action {
    type: ActionName.UPDATE_POINTS;
    points: number[];
}

export interface IloadImageAction extends Action {
    type: ActionName.LOAD_IMAGE;
    image: HTMLImageElement;
}

export interface IselectExample extends Action {
    type: ActionName.SELECT_EXAMPLE;
    index: number;
}

export type Action = IupdatePointAction | IloadImageAction | IselectExample;

export const updatePointAction = (points: number[]): IupdatePointAction => {
    return {
        points,
        type: ActionName.UPDATE_POINTS,
    };
};

export const loadImageAction = (image: HTMLImageElement): IloadImageAction => {
    return {
        image,
        type: ActionName.LOAD_IMAGE,
    };
};

export const selectExample = (index: number): IselectExample => {
    return {
        index,
        type: ActionName.SELECT_EXAMPLE,
    };
};