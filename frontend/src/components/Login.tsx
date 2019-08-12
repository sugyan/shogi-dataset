import React, { useCallback, useState } from "react";
import { Button } from "reactstrap";

const Login: React.FC = (): JSX.Element => {
    const [submitting, setSubmitting] = useState(false);
    const onClickLogout = useCallback((): void => {
        if (submitting) {
            return;
        }
        setSubmitting(true);
        fetch(
            "/api/auth/github",
        ).then((res: Response): Promise<string> => {
            if (res.ok) {
                return res.text();
            } else {
                throw new Error(res.statusText);
            }
        }).then((redirectUrl): void => {
            window.location.replace(redirectUrl);
        }).catch((err: Error): void => {
            window.console.error(err.message);
        }).finally((): void => {
            setSubmitting(false);
        });
    }, [submitting]);
    return (
      <div>
        <Button color="outline-primary" disabled={submitting} onClick={onClickLogout}>
          Login with GitHub
        </Button>
      </div>
    );
};

export default Login;
