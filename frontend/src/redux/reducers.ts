import { Reducer, combineReducers } from "redux";

import { ActionTypes, UserAction } from "./actions";

export enum UserRole {
    anonymous = "anonymous",
    viewer = "viewer",
    editor = "editor",
}

export interface User {
    name?: string;
    role: UserRole;
}

export interface UserState {
    user?: User;
}

const userReducer: Reducer<UserState, UserAction> = (state: UserState = {}, action: UserAction): UserState => {
    switch (action.type) {
        case ActionTypes.SET_USER:
            return {
                ...state,
                user: action.user,
            };
        default:
            return state;
    }
};

export const reducer = combineReducers({
    userReducer,
});
