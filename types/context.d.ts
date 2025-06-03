export interface PayloadRepository {
    [key: string]: any;
    full_name?: string;
    name: string;
    owner: {
        [key: string]: any;
        login: string;
        name?: string;
    };
    html_url?: string;
}
export interface WebhookPayload {
    [key: string]: any;
    repository?: PayloadRepository;
    issue?: {
        [key: string]: any;
        number: number;
        html_url?: string;
        body?: string;
    };
    pull_request?: {
        [key: string]: any;
        number: number;
        html_url?: string;
        body?: string;
    };
    sender?: {
        [key: string]: any;
        type: string;
    };
    action?: string;
    installation?: {
        id: number;
        [key: string]: any;
    };
    comment?: {
        id: number;
        [key: string]: any;
    };
}
export declare class Context {
    /**
     * Webhook payload object that triggered the workflow
     */
    payload: WebhookPayload;
    eventName: string;
    sha: string;
    ref: string;
    workflow: string;
    action: string;
    actor: string;
    job: string;
    runAttempt: number;
    runNumber: number;
    runId: number;
    apiUrl: string;
    serverUrl: string;
    graphqlUrl: string;
    /**
     * Hydrate the context from the environment
     */
    constructor();
    get issue(): {
        owner: string;
        repo: string;
        number: number;
    };
    get repo(): {
        owner: string;
        repo: string;
    };
}
