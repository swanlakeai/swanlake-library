import { JsonApiDataInterface } from "./interfaces/JsonApiDataInterface";
export type configureRelationshipsFunction = () => void;
export declare class JsonApiBuilder {
    private _configureRelationships;
    constructor(_configureRelationships: configureRelationshipsFunction);
    serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R): any;
    private serialiseData;
    private serialiseRelationship;
}
