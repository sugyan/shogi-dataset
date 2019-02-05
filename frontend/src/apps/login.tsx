import * as React from "react";

class Login extends React.Component {
    public render() {
        return (
            <div>
              <a className="btn btn-outline-primary" href="/oauth2/github">
                Login with GitHub
              </a>
            </div>
        );
    }
}
export default Login;
