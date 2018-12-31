import { CommonAction, CommonActionName } from "../actions/common";

export enum userRole {
    anonymous = "anonymous",
    viewer = "viewer",
    editor = "editor",
}

export interface Iuser {
    name?: string;
    role: userRole;
}

export interface IcommonState {
    user?: Iuser;
}

const initialState: IcommonState = {
};

export function commonReducer(state: IcommonState = initialState, action: CommonAction): IcommonState {
    switch (action.type) {
    case CommonActionName.SET_USER:
        return {
            ...state,
            user: action.user,
        };
    default:
        return state;
    }
}
