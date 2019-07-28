import React from "react";

const Login: React.FC = (): JSX.Element => {
    return (
      <div>
        <a className="btn btn-outline-primary" href="/oauth2/github">
          Login with GitHub
        </a>
      </div>
    );
};
export default Login;
