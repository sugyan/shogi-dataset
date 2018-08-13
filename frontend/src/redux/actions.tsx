import { Action } from "redux";

export enum ActionName {
    UPDATE_POINTS = "UPDATE_POINTS",
    LOAD_IMAGE    = "LOAD_IMAGE",
}

export interface IupdatePointAction extends Action {
    type: ActionName.UPDATE_POINTS;
    points: number[];
}

export interface IloadImageAction extends Action {
    type: ActionName.LOAD_IMAGE;
    image: HTMLImageElement;
}

export type Action = IupdatePointAction | IloadImageAction;

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
