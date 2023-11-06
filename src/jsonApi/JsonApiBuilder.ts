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

declare const DEFAULT_PAGINATION_COUNT = 25;

export class JsonApiBuilder {
	constructor(private _configureRelationships: configureRelationshipsFunction) {}

	generateCursor(pagination?: JsonApiPaginationInterface): JsonApiCursorInterface {
		const cursor: JsonApiCursorInterface = {
			cursor: undefined,
			take: undefined,
		};

		if (!pagination) return cursor;

		if (pagination.size) {
			cursor.take = pagination.size;
		}

		if (pagination.before) {
			cursor.cursor = pagination.before;
			cursor.take = -((pagination.size ?? DEFAULT_PAGINATION_COUNT) + 1);
		} else if (pagination.after) {
			cursor.cursor = pagination.after;
			cursor.take = (pagination.size ?? DEFAULT_PAGINATION_COUNT) + 1;
		}

		return cursor;
	}

	private updatePagination(
		pagination: JsonApiPaginationInterface,
		data: any[],
		idName?: string
	): JsonApiPaginationInterface {
		if (!pagination.idName) pagination.idName = idName ?? "id";
		const hasEnoughData = data.length === (pagination?.size ?? DEFAULT_PAGINATION_COUNT + 1);
		if (!pagination.before && !pagination.after && hasEnoughData) {
			pagination.after = data[data.length][pagination.idName];
			pagination.before = data[data.length][pagination.idName];

			return pagination;
		}

		if (pagination.before) {
			pagination.after = pagination.before;
			if (hasEnoughData) pagination.before = data[0][pagination.idName];

			return pagination;
		}

		pagination.before = pagination.after;
		if (hasEnoughData) pagination.after = data[data.length][pagination.idName];

		return pagination;
	}

	serialise<T, R extends JsonApiDataInterface>(
		data: T | T[],
		builder: R,
		url: string,
		idName?: string,
		pagination?: JsonApiPaginationInterface
	): any {
		this._configureRelationships();

		const response: any = {
			data: undefined,
			links: {
				self: url,
			},
		};

		if (pagination && Array.isArray(data)) {
			pagination = this.updatePagination(pagination, data, idName);

			if (!pagination.size) pagination.size = DEFAULT_PAGINATION_COUNT;

			if (data.length === (pagination?.size ?? DEFAULT_PAGINATION_COUNT + 1)) {
				response.links.self = url + (url.indexOf("?") === -1 ? "?" : "&") + `page[size]=${pagination.size.toString()}`;

				if (pagination.after) {
					response.links.next =
						url +
						(url.indexOf("?") === -1 ? "?" : "&") +
						`page[size]=${pagination.size.toString()}&page[after]=${pagination.after}`;
				}

				if (pagination.before) {
					response.links.prev =
						url +
						(url.indexOf("?") === -1 ? "?" : "&") +
						`page[size]=${pagination.size.toString()}&page[before]=${pagination.before}`;
				}

				data.splice(pagination.size, 1);
			}
		}

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
