import * as React from "react";

export class Navbar extends React.Component<{}, {}> {
    render() {
        return (
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
              <a className="navbar-brand" href="/">
                Shogi Dataset
              </a>
            </nav>
        );
    }
}
