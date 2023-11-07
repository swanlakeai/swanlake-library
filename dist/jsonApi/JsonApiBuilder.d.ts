import { JsonApiDataInterface } from "./interfaces/JsonApiDataInterface";
export interface JsonApiPaginationInterface {
    size?: number;
    before?: string;
    after?: string;
    idName?: string;
}
export interface JsonApiCursorInterface {
    cursor?: string;
    take?: number;
}
export interface JsonApiRelationshipBuilderInterface {
    type: string;
    id: string;
}
export declare class JsonApiBuilder {
    private _paginationCount;
    private _pagination;
    constructor(query?: any);
    private get size();
    generateCursor(): JsonApiCursorInterface;
    private updatePagination;
    serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R, url?: string, idName?: string): any;
    private serialiseData;
    private serialiseRelationship;
}
