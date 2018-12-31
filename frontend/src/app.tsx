import * as React from "react";
import { connect } from "react-redux";
import { BrowserRouter, Link, Route } from "react-router-dom";
import { Dispatch } from "redux";

import Image from "./apps/image";
import Index from "./apps/index";
import Label from "./apps/label";
import Login from "./apps/login";
import Upload from "./apps/upload";
import { CommonAction, setUserAction } from "./redux/actions/common";
import { Istate } from "./redux/reducer";
import { Iuser, userRole } from "./redux/reducers/common";

interface IstateProps {
    user?: Iuser;
}

interface IdispatchProps {
    setUser: (user: Iuser) => CommonAction;
}

type Props = IstateProps & IdispatchProps;

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
        const { user } = this.props;
        let editorMenu: React.ReactNode;
        if (user && user.role === userRole.editor) {
            editorMenu = (
                <React.Fragment>
                  <li className="nav-item">
                    <Link to="/upload" className="nav-link">Upload</Link>
                  </li>
                </React.Fragment>
            );
        }
        return (
            <BrowserRouter>
              <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                  <div className="container">
                    <Link to="/" className="navbar-brand">Shogi Dataset</Link>
                    <div className="collapse navbar-collapse">
                      <ul className="navbar-nav">
                        {editorMenu}
                      </ul>
                    </div>
                  </div>
                </nav>
                <div className="container py-md-3">
                  <div>
                    <Route exact path="/" component={Index} />
                    <Route exact path="/login" component={Login} />
                    <Route path="/image" component={Image} />
                    <Route path="/label/:label" component={Label} />
                    <Route exact path="/upload" component={Upload} />
                  </div>
                </div>
              </div>
            </BrowserRouter>
        );
    }
}

export default connect(
    (state: Istate): IstateProps => {
        return {
            user: state.commonReducer.user,
        };
    },
    (dispatch: Dispatch): IdispatchProps => {
        return {
            setUser: (user: Iuser): CommonAction => dispatch(setUserAction(user)),
        };
    },
)(App);
