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
    constructor(_configureRelationships: configureRelationshipsFunction);
    generatePagination(query: any): JsonApiPaginationInterface | undefined;
    generateCursor(pagination?: JsonApiPaginationInterface): JsonApiCursorInterface;
    private updatePagination;
    serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R, url?: string, idName?: string, pagination?: JsonApiPaginationInterface): any;
    private serialiseData;
    private serialiseRelationship;
}
