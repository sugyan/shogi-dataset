import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import { Link } from "react-router-dom";

import { Istate } from "../redux/reducer";
import { Iuser, userRole } from "../redux/reducers/common";

interface IstateProps {
    user?: Iuser;
}

type Props = IstateProps & RouteComponentProps<{}>;

interface InavbarState {
    showDropdown: boolean;
}

class Navbar extends React.Component<Props, InavbarState> {
    public constructor(props: Props) {
        super(props);
        this.state = {
            showDropdown: false,
        };
    }
    public componentWillReceiveProps(nextProps: Props) {
        const { location } = this.props;
        if (nextProps.location.pathname !== location.pathname) {
            this.setState({ showDropdown: false });
        }
    }
    public render() {
        const { user } = this.props;
        const { showDropdown } = this.state;
        let editorMenu: React.ReactNode;
        let userMenu: React.ReactNode;
        if (user && user.role === userRole.editor) {
            editorMenu = (
                <li className="nav-item">
                  <Link to="/upload" className="nav-link">Upload</Link>
                </li>
            );
            userMenu = (
                <div>
                  <ul className="navbar-nav">
                    <li className="nav-item dropdown">
                      <a className="nav-link dropdown-toggle" href="#" onClick={this.toggleDropdown.bind(this)}>
                        {user.name}
                      </a>
                      <div className={`dropdown-menu dropdown-menu-right ${showDropdown ? "show" : ""}`}>
                        <a className="dropdown-item" href="/logout">Logout</a>
                      </div>
                    </li>
                  </ul>
                </div>
            );
        }
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
              <div className="container">
                <Link to="/" className="navbar-brand">Shogi Dataset</Link>
                <div className="collapse navbar-collapse">
                  <ul className="navbar-nav">
                    {editorMenu}
                  </ul>
                </div>
                {userMenu}
              </div>
            </nav>
        );
    }
    private toggleDropdown(ev: React.MouseEvent<HTMLAnchorElement>) {
        ev.preventDefault();
        const { showDropdown } = this.state;
        this.setState({
            showDropdown: !showDropdown,
        });
    }
}
export default withRouter(connect(
    (state: Istate): IstateProps => {
        return {
            user: state.commonReducer.user,
        };
    },
)(Navbar));
