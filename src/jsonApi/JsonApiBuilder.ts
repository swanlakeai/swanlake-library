import { bufferToUuid } from "../index";
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

export class JsonApiBuilder {
	private _paginationCount = 25;
	private _pagination: JsonApiPaginationInterface = {};

	constructor(query?: any) {
		if (query?.["page[size]"]) this._pagination.size = +query["page[size]"];
		if (query?.["page[before]"]) this._pagination.before = query["page[before]"];
		if (query?.["page[after]"]) this._pagination.after = query["page[after]"];
	}

	private get size(): number {
		return (this._pagination?.size ?? this._paginationCount) + 1;
	}

	generateCursor(): JsonApiCursorInterface {
		const cursor: JsonApiCursorInterface = {
			cursor: undefined,
			take: this.size,
		};

		if (this._pagination.before) {
			cursor.cursor = this._pagination.before;
			cursor.take = -this.size;
		} else if (this._pagination.after) {
			cursor.cursor = this._pagination.after;
			cursor.take = this.size;
		}

		return cursor;
	}

	private updatePagination(data: any[], idName?: string): void {
		if (!this._pagination.idName) this._pagination.idName = idName ?? "id";
		const hasEnoughData = data.length === this.size;
		if (!this._pagination.before && !this._pagination.after && hasEnoughData) {
			this._pagination.after = bufferToUuid(data[data.length - 1][this._pagination.idName]);

			return;
		}

		if (this._pagination.before) {
			this._pagination.after = this._pagination.before;
			if (hasEnoughData) this._pagination.before = bufferToUuid(data[0][this._pagination.idName]);

			return;
		}

		this._pagination.before = this._pagination.after;
		if (hasEnoughData) this._pagination.after = bufferToUuid(data[data.length - 1][this._pagination.idName]);
	}

	serialise<T, R extends JsonApiDataInterface>(data: T | T[], builder: R, url?: string, idName?: string): any {
		const response: any = {
			links: {
				self: url,
			},
			data: undefined,
		};

		if (Array.isArray(data) && data.length <= this.size) {
			if (url) {
				if (Array.isArray(data) && !this._pagination)
					this._pagination = {
						size: this._paginationCount,
					};

				if (this._pagination && Array.isArray(data)) {
					this.updatePagination(data, idName);

					if (!this._pagination.size) this._pagination.size = this._paginationCount;

					if (data.length === this.size) {
						response.links.self =
							url + (url.indexOf("?") === -1 ? "?" : "&") + `page[size]=${this._pagination.size.toString()}`;

						if (this._pagination.after) {
							response.links.next =
								url +
								(url.indexOf("?") === -1 ? "?" : "&") +
								`page[size]=${this._pagination.size.toString()}&page[after]=${this._pagination.after}`;
						}

						data.splice(this._pagination.size, 1);
					}

					if (this._pagination.before) {
						response.links.prev =
							url +
							(url.indexOf("?") === -1 ? "?" : "&") +
							`page[size]=${this._pagination.size.toString()}&page[before]=${this._pagination.before}`;
					}
				}
			} else {
				delete response.links;
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
				let resourceLinkage: any = {};

				if (relationship[1].resourceIdentifier) {
					const minimalData: any = {
						type: relationship[1].resourceIdentifier.type,
					};

					try {
						if (typeof relationship[1].resourceIdentifier.id === "function") {
							minimalData.id = relationship[1].resourceIdentifier.id(data);
						} else {
							minimalData.id = data[relationship[1].resourceIdentifier.id];
						}

						resourceLinkage = {
							data: minimalData,
						};
						if (relationship[1].links) {
							resourceLinkage.links = {
								related: relationship[1].links.related(data),
							};
						}

						serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
					} catch (e) {}
				} else if (data[relationship[0]]) {
					const { minimalData, relationshipLink, additionalIncludeds } = this.serialiseRelationship(
						data[relationship[0]],
						relationship[1].data
					);

					resourceLinkage = {
						data: minimalData,
					};

					if (relationshipLink) {
						resourceLinkage.links = relationshipLink;
					} else if (relationship[1].links) {
						resourceLinkage.links = {
							related: relationship[1].links.related(data),
						};
					}
					if (relationship[1].included && additionalIncludeds.length > 0) includedElements.push(...additionalIncludeds);
					serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
				} else if (relationship[1].links) {
					const related = relationship[1].links.related(data);

					if (related) {
						resourceLinkage.links = {
							related: related,
						};
						serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
					}
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
