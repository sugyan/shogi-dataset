import { useEffect } from "react";
import { withRouter, RouteComponentProps } from "react-router";

type Props = RouteComponentProps<{}>;

const AuthCallback: React.FC<Props> = (props: Props): null => {
    useEffect((): void => {
        const params = new URLSearchParams(window.location.search);
        fetch(
            "/api/auth/callback", {
                method: "POST",
                body: JSON.stringify({
                    code: params.get("code"),
                    state: params.get("state"),
                }),
            },
        ).then((res: Response): void => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }
        }).catch((err: Error): void => {
            window.console.error(err.message);
            // TODO
        }).finally((): void => {
            window.location.replace("/");
        });
    }, [props.history]);

    return null;
};

export default withRouter(AuthCallback);
