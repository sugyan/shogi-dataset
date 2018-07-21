import { Action } from "redux";

export enum ActionName {
    UPDATE_POINTS = "UPDATE_POINTS",
}

interface IupdatePointAction extends Action {
    points: number[];
}

export type Action = IupdatePointAction;

export const updatePointAction = (points: number[]): IupdatePointAction => {
    return {
        points,
        type: ActionName.UPDATE_POINTS,
    };
};
