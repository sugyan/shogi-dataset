import React from "react";
import { connect } from "react-redux";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { Dispatch } from "redux";
import {
    Navbar, NavbarBrand, Nav, Collapse,
    UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem,
} from "reactstrap";

import Index from "./components/Index";
import Label from "./components/Label";
import Login from "./components/Login";
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
        });
    }
    public render(): JSX.Element {
        return (
          <Router>
            {this.navbar()}
            <div className="container py-md-3">
              <Route exact path="/" component={Index} />
              <Route exact path="/login" component={Login} />
              <Route path="/label/:label" component={Label} />
            </div>
          </Router>
        );
    }
    private navbar(): JSX.Element {
        const { user } = this.props;
        const userMenu = (user && user.role !== UserRole.anonymous) ? (
          <Collapse isOpen={true}>
            <Nav navbar>
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>{user.name}</DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem tag={Link} to="/api">API</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem tag="a" href="/logout">Logout</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </Nav>
          </Collapse>
        ) : null;
        return (
          <Navbar expand="lg" light className="bg-light" >
            <div className="container">
              <NavbarBrand tag={Link} to="/">Shogi Dataset</NavbarBrand>
              {userMenu}
            </div>
          </Navbar>
        );
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
