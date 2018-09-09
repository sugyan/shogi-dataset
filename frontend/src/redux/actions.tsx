import { Action } from "redux";

import { IdivideNums } from "./reducers";

export enum ActionName {
    CHANGE_DIVIDE     = "CHANGE_DIVIDE",
    LOAD_IMAGE        = "LOAD_IMAGE",
    UPDATE_IMAGE_DATA = "UPDATE_IMAGEDATA",
    UPDATE_POINTS     = "UPDATE_POINTS",
}

export interface IchangeDivideAction extends Action {
    type: ActionName.CHANGE_DIVIDE;
    divide: IdivideNums;
}

export interface IloadImageAction extends Action {
    type: ActionName.LOAD_IMAGE;
    image: HTMLImageElement;
}

export interface IupdateImageDataAction extends Action {
    type: ActionName.UPDATE_IMAGE_DATA;
    imageData: ImageData;
}

export interface IupdatePointAction extends Action {
    type: ActionName.UPDATE_POINTS;
    points: number[];
}

export type Action =
    | IchangeDivideAction
    | IloadImageAction
    | IupdateImageDataAction
    | IupdatePointAction;

export const changeDivideAction = (divide: IdivideNums): IchangeDivideAction => {
    return {
        divide,
        type: ActionName.CHANGE_DIVIDE,
    };
};

export const loadImageAction = (image: HTMLImageElement): IloadImageAction => {
    return {
        image,
        type: ActionName.LOAD_IMAGE,
    };
};

export const updateImageDataAction = (imageData: ImageData): IupdateImageDataAction => {
    return {
        imageData,
        type: ActionName.UPDATE_IMAGE_DATA,
    };
};

export const updatePointAction = (points: number[]): IupdatePointAction => {
    return {
        points,
        type: ActionName.UPDATE_POINTS,
    };
};
