import { Action } from "redux";

import { User } from "./reducers";

export enum ActionTypes {
    SET_USER = "SET_USER",
}

interface SetUserAction extends Action {
    type: ActionTypes.SET_USER;
    user: User;
}

export type UserAction = SetUserAction;

export const setUser = (user: User): SetUserAction => {
    return {
        type: ActionTypes.SET_USER,
        user,
    };
};
