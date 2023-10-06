export declare class Imgix {
    private _client;
    constructor(domain: string, token: string);
    buildURL(path: string, params: any): string;
}
