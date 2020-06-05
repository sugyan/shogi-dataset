import React from "react";
import { connect } from "react-redux";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Dispatch } from "redux";
import {
    Navbar, NavbarBrand, Nav, NavItem, Collapse, Container,
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Button,
} from "reactstrap";

import Api from "./components/Api";
import AuthCallback from "./components/AuthCallback";
import Image from "./components/Image";
import Index from "./components/Index";
import Label from "./components/Label";
import Login from "./components/Login";
import Upload from "./components/Upload";
import { UserRole, User } from "./redux/reducers";
import { AppState } from "./redux/store";
import { UserAction, setUser } from "./redux/actions";

interface StateProps {
    user?: User;
}

interface DispatchProps {
    setUser: (user: User) => void;
}

type Props = StateProps & DispatchProps;

class App extends React.Component<Props> {
    public componentDidMount(): void {
        const { setUser } = this.props;
        fetch(
            "/api/user",
        ).then((res: Response): Promise<User> => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error(res.statusText);
            }
        }).then((user: User): void => {
            if (user.name && user.role) {
                setUser(user);
            } else {
                setUser({ role: UserRole.anonymous });
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
            setUser({ role: UserRole.anonymous });
        });
    }
    public render(): JSX.Element {
        return (
          <Router>
            {this.navbar()}
            <Container className="py-md-3">
              <Route exact path="/" component={Index} />
              <Route exact path="/api" component={Api} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/auth/callback" component={AuthCallback} />
              <Route path="/image" component={Image} />
              <Route path="/label/:label" component={Label} />
              <Route exact path="/upload" component={Upload} />
            </Container>
          </Router>
        );
    }
    private navbar(): JSX.Element {
        const { user } = this.props;
        const editorMenu = (user && user.role === UserRole.editor) ? (
          <NavItem>
            <Link to="/upload" className="nav-link">Upload</Link>
          </NavItem>
        ) : null;
        const userMenu = (user && user.role !== UserRole.anonymous) ? (
          <Collapse isOpen={true}>
            <Nav navbar>
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>{user.name}</DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem tag={Link} to="/api">API</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem tag={Button} onClick={this.onClickLogout.bind(this)}>Logout</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </Nav>
          </Collapse>
        ) : null;
        return (
          <Navbar expand="lg" light className="bg-light" >
            <Container>
              <NavbarBrand tag={Link} to="/">Shogi Dataset</NavbarBrand>
              <Collapse navbar>
                <Nav navbar>
                  {editorMenu}
                </Nav>
              </Collapse>
              {userMenu}
            </Container>
          </Navbar>
        );
    }
    private onClickLogout(): void {
        fetch(
            "/api/auth/logout", {
                method: "POST",
            },
        ).then((res: Response): void => {
            if (res.ok) {
                window.location.replace("/");
            } else {
                throw new Error(res.statusText);
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
}

export default connect(
    (state: AppState): StateProps => {
        return {
            user: state.userReducer.user,
        };
    },
    (dispatch: Dispatch<UserAction>): DispatchProps => {
        return {
            setUser: (user: User): void => {
                dispatch(setUser(user));
            },
        };
    }
)(App);
