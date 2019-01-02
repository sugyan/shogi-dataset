import * as React from "react";
import { connect } from "react-redux";
import { BrowserRouter, Link, Route } from "react-router-dom";
import { Dispatch } from "redux";

import Image from "./apps/image";
import Index from "./apps/index";
import Label from "./apps/label";
import Login from "./apps/login";
import Upload from "./apps/upload";
import Navbar from "./components/navbar";
import { CommonAction, setUserAction } from "./redux/actions/common";
import { Istate } from "./redux/reducer";
import { Iuser, userRole } from "./redux/reducers/common";

interface IdispatchProps {
    setUser: (user: Iuser) => CommonAction;
}

type Props = IdispatchProps;

class App extends React.Component<Props> {
    public componentDidMount() {
        const { setUser } = this.props;
        fetch(
            "/api/user",
        ).then((res: Response) => {
            return res.json();
        }).then((user: Iuser) => {
            if (user.name && user.role) {
                setUser(user);
            } else {
                setUser({ role: userRole.anonymous });
            }
        });
    }
    public render() {
        return (
            <BrowserRouter>
              <div>
                <Navbar />
                <div className="container py-md-3">
                  <Route exact path="/" component={Index} />
                  <Route exact path="/login" component={Login} />
                  <Route path="/image" component={Image} />
                  <Route path="/label/:label" component={Label} />
                  <Route exact path="/upload" component={Upload} />
                </div>
              </div>
            </BrowserRouter>
        );
    }
}
export default connect(
    (state: Istate) => state,
    (dispatch: Dispatch): IdispatchProps => {
        return {
            setUser: (user: Iuser): CommonAction => dispatch(setUserAction(user)),
        };
    },
)(App);
