import { JsonApiRelationshipBuilderInterface } from "./interfaces/JsonApiRelationshipBuilderInterface";
export declare class JsonApiRelationshipBuilder implements JsonApiRelationshipBuilderInterface {
    type: string;
    id: string;
    constructor(type: string, id: string);
}
