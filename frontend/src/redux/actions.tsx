import { Action } from "redux";

import { IdivideNums } from "./reducers";

export enum ActionName {
    LOAD_IMAGE    = "LOAD_IMAGE",
    UPDATE_POINTS = "UPDATE_POINTS",
    CHANGE_DIVIDE = "CHANGE_DIVIDE",
}

export interface IloadImageAction extends Action {
    type: ActionName.LOAD_IMAGE;
    image: HTMLImageElement;
}

export interface IupdatePointAction extends Action {
    type: ActionName.UPDATE_POINTS;
    points: number[];
}

export interface IchangeDivideAction extends Action {
    type: ActionName.CHANGE_DIVIDE;
    divide: IdivideNums;
}

export type Action = IupdatePointAction | IloadImageAction | IchangeDivideAction;

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

export const changeDivideAction = (divide: IdivideNums): IchangeDivideAction => {
    return {
        divide,
        type: ActionName.CHANGE_DIVIDE,
    };
};
