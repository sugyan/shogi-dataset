import { Action } from "redux";

import { Iuser } from "../reducers/common";

export enum CommonActionName {
    SET_USER = "SET_USER",
}

interface IsetUserAction extends Action {
    type: CommonActionName.SET_USER;
    user: Iuser;
}

export type CommonAction = IsetUserAction;

export const setUserAction = (user: Iuser): IsetUserAction => {
    return {
        type: CommonActionName.SET_USER,
        user,
    };
};
