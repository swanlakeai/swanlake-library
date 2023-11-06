import { JsonApiDataInterface } from "./interfaces/JsonApiDataInterface";
export type configureRelationshipsFunction = () => void;
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
export declare class JsonApiBuilder {
    private _configureRelationships;
    private _paginationCount;
    private _pagination;
    constructor(_configureRelationships: configureRelationshipsFunction, query?: any);
    generateCursor(): JsonApiCursorInterface;
    private updatePagination;
    serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R, url?: string, idName?: string): any;
    private serialiseData;
    private serialiseRelationship;
}
