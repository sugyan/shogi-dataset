import React from "react";

interface Param {
    key: string;
    required: boolean;
}

interface ApiMethod {
    endpoint: string;
    method: string;
    name: string;
    params: Param[];
}

interface State {
    tokens: string[];
    submitting: boolean;
    responses: string[];
}

class Api extends React.Component<{}, State> {
    private apis: ApiMethod[] = [{
        endpoint: "/api/total",
        method: "GET",
        name: "Get total",
        params: [],
    }, {
        endpoint: "/api/images",
        method: "GET",
        name: "Get images",
        params: [
            { key: "cursor", required: false },
            { key: "label", required: false },
        ],
    }];

    public constructor(props: {}) {
        super(props);
        this.state = {
            tokens: [],
            submitting: false,
            responses: [],
        };
    }
    public componentDidMount(): void {
        fetch(
            "/api/token",
        ).then((res: Response): Promise<string[]> => {
            if (res.ok) {
                return res.json();
            }
            throw new Error(res.statusText);
        }).then((tokens: string[]): void => {
            this.updateTokens(tokens);
        }).catch((err: Error): void => {
            window.console.error(err.message);
        });
    }
    public render(): JSX.Element {
        const { tokens, submitting } = this.state;
        const tokenList = tokens.map((token: string, index: number): JSX.Element => {
            return (
              <p key={index} style={{ padding: 10, backgroundColor: "#f7f7f9" }}>
                <code>{token}</code>
              </p>
            );
        });
        return (
          <React.Fragment>
            <h2>API</h2>
            <h3>Your token</h3>
            {tokenList}
            <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={this.onClickGenerate.bind(this)}>
              {tokens.length > 0 ? "Regenerate" : "Generate"}
            </button>
            {tokens.length > 0 && this.renderApiDocuments()}
          </React.Fragment>
        );
    }
    private renderApiDocuments(): JSX.Element {
        const { tokens, responses } = this.state;
        const header = `-H 'Authorization: Bearer ${tokens[0]}'`;
        const apiUrlBase = `${window.location.protocol}//${window.location.host}`;
        const docs = this.apis.map((api: ApiMethod, index: number): JSX.Element => {
            return (
              <React.Fragment key={index}>
                <h4>{api.name}</h4>
                <dl>
                  <dt>Endpoint</dt>
                  <dd><code>{api.endpoint}</code></dd>
                  <dt>Method</dt>
                  <dd><code>{api.method}</code></dd>
                  <dt>Parameters</dt>
                  <dd>
                    <ul>
                      {api.params.map((param: Param, index: number): JSX.Element => {
                          return (
                            <li key={index}>
                              <code>{param.key}</code>: <var>{param.required ? "required" : "optional"}</var>
                            </li>
                          );
                      })}
                    </ul>
                  </dd>
                  <dt>Example</dt>
                  <dd><code>{`curl ${header} ${apiUrlBase}${api.endpoint}`}</code></dd>
                  <dt>Response</dt>
                  <dd>
                    <pre style={{ backgroundColor: "#f7f7f9", padding: 10 }}>
                      <samp>{responses[index]}</samp>
                    </pre>
                  </dd>
                </dl>
              </React.Fragment>
            );
        });
        return (
          <React.Fragment>
            <hr />
            <h3>APIs</h3>
            {docs}
          </React.Fragment>
        );
    }
    private onClickGenerate(): void {
        this.setState({ submitting: true });
        fetch(
            "/api/token", { method: "POST" },
        ).then((res: Response): Promise<string[]> => {
            if (res.ok) {
                return res.json();
            }
            throw new Error(res.statusText);
        }).then((tokens: string[]): void => {
            this.updateTokens(tokens);
        }).catch((err: Error): void => {
            window.console.error(err.message);
        }).finally((): void => {
            this.setState({ submitting: false });
        });
    }
    private updateTokens(tokens: string[]): void {
        if (tokens.length === 0) {
            return;
        }
        this.setState({ tokens }, (): void => {
            this.apis.forEach((api: ApiMethod, index: number): void => {
                fetch(
                    api.endpoint, {
                        credentials: "omit",
                        headers: {
                            Authorization: `Bearer ${tokens[0]}`,
                        },
                    },
                ).then((res: Response): Promise<JSON> => {
                    if (res.ok) {
                        return res.json();
                    }
                    throw new Error(res.statusText);
                }).then((json: JSON): void => {
                    const { responses } = this.state;
                    responses[index] = JSON.stringify(json, null, "  ");
                    this.setState({ responses });
                }).catch((err: Error): void => {
                    window.console.error(err.message);
                });
            });
        });
    }
}

export default Api;