import { JsonApiRelationshipBuilderInterface } from "./interfaces/JsonApiRelationshipBuilderInterface";

export class JsonApiRelationshipBuilder implements JsonApiRelationshipBuilderInterface {
	type: string;
	id: string;

	constructor(type: string, id: string) {
		this.type = type;
		this.id = id;
	}
}
