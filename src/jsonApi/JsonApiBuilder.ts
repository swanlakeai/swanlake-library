import { JsonApiDataInterface } from "./interfaces/JsonApiDataInterface";

export type configureRelationshipsFunction = () => void;

export class JsonApiBuilder {
	constructor(private _configureRelationships: configureRelationshipsFunction) {}

	serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R): any {
		this._configureRelationships();

		const response: any = {
			data: undefined,
		};

		let included: any[] = [];

		if (Array.isArray(data)) {
			const serialisedResults = data.map((item: T) => this.serialiseData(item, builder));
			response.data = serialisedResults.map((result) => result.serialisedData);
			included = ([] as any[]).concat(...serialisedResults.map((result) => result.includedElements));
		} else {
			const { serialisedData, includedElements } = this.serialiseData(data, builder);
			response.data = serialisedData;
			included = includedElements;
		}

		if (included.length > 0) {
			response.included = included;
		}

		return response;
	}

	private serialiseData<T, R extends JsonApiDataInterface>(
		data: T,
		builder: R
	): {
		serialisedData: any | any[];
		includedElements: any[];
	} {
		const includedElements: any[] = [];
		const serialisedData: any = {
			type: builder.type,
		};

		if (typeof builder.id === "function") {
			serialisedData.id = builder.id(data);
		} else {
			serialisedData.id = data[builder.id];
		}

		if (builder.links) {
			serialisedData.links = {
				self: builder.links.self(data),
			};
		}

		serialisedData.attributes = {};

		Object.keys(builder.attributes).forEach((attribute) => {
			if (typeof builder.attributes[attribute] === "function") {
				serialisedData.attributes[attribute] = builder.attributes[attribute](data);
			} else {
				serialisedData.attributes[attribute] = data[attribute];
			}
		});

		if (builder.meta) {
			serialisedData.meta = {};
			Object.keys(builder.meta).forEach((meta) => {
				if (typeof builder.meta[meta] === "function") {
					serialisedData.meta[meta] = builder.meta[meta](data);
				} else {
					serialisedData.meta[meta] = data[meta];
				}
			});
		}

		if (builder.relationships) {
			serialisedData.relationships = {};

			Object.entries(builder.relationships).forEach((relationship) => {
				if (data[relationship[0]]) {
					const { minimalData, relationshipLink, additionalIncludeds } = this.serialiseRelationship(
						data[relationship[0]],
						relationship[1].data
					);

					const resourceLinkage: any = {
						data: minimalData,
					};

					if (relationshipLink) {
						resourceLinkage.links = relationshipLink;
					} else if (relationship[1].links) {
						resourceLinkage.links = {
							related: relationship[1].links.related(data),
						};
					}

					serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;

					if (relationship[1].included && additionalIncludeds.length > 0) includedElements.push(...additionalIncludeds);
				}
			});

			if (Object.keys(serialisedData.relationships).length === 0) delete serialisedData.relationships;
		}

		return {
			serialisedData: serialisedData,
			includedElements: includedElements,
		};
	}

	private serialiseRelationship<T, R extends JsonApiDataInterface>(
		data: T | T[],
		builder: R
	): {
		minimalData: any | any[];
		relationshipLink: any;
		additionalIncludeds: any[];
	} {
		const response = {
			minimalData: undefined,
			relationshipLink: undefined,
			additionalIncludeds: [],
		};

		if (Array.isArray(data)) {
			const serialisedResults = data.map((item: T) => this.serialiseData(item, builder));
			const serialisedData = serialisedResults.map((result) => result.serialisedData);
			const includedElements = ([] as any[]).concat(...serialisedResults.map((result) => result.includedElements));

			response.minimalData = serialisedData.map((result) => {
				return { type: result.type, id: result.id };
			});

			response.additionalIncludeds = ([] as any[]).concat(...includedElements).concat(serialisedData);
		} else {
			const { serialisedData, includedElements } = this.serialiseData(data, builder);

			response.minimalData = {
				type: serialisedData.type,
				id: serialisedData.id,
			};

			if (serialisedData.links) {
				response.relationshipLink = {
					self: serialisedData.links.self,
				};
			}

			response.additionalIncludeds = [...includedElements, serialisedData];
		}

		return response;
	}
}
