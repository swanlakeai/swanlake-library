"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonApiBuilder = void 0;
const index_1 = require("../index");
class JsonApiBuilder {
    constructor(query) {
        this._paginationCount = 25;
        this._pagination = {};
        if (query?.["page[size]"])
            this._pagination.size = +query["page[size]"];
        if (query?.["page[before]"])
            this._pagination.before = query["page[before]"];
        if (query?.["page[after]"])
            this._pagination.after = query["page[after]"];
    }
    get size() {
        return (this._pagination?.size ?? this._paginationCount) + 1;
    }
    generateCursor() {
        const cursor = {
            cursor: undefined,
            take: this.size,
        };
        if (this._pagination.before) {
            cursor.cursor = this._pagination.before;
            cursor.take = -this.size;
        }
        else if (this._pagination.after) {
            cursor.cursor = this._pagination.after;
            cursor.take = this.size;
        }
        return cursor;
    }
    updatePagination(data, idName) {
        if (!this._pagination.idName)
            this._pagination.idName = idName ?? "id";
        const hasEnoughData = data.length === this.size;
        if (!this._pagination.before && !this._pagination.after && hasEnoughData) {
            this._pagination.after = (0, index_1.bufferToUuid)(data[data.length - 1][this._pagination.idName]);
            return;
        }
        if (this._pagination.before) {
            this._pagination.after = this._pagination.before;
            if (hasEnoughData)
                this._pagination.before = (0, index_1.bufferToUuid)(data[0][this._pagination.idName]);
            return;
        }
        this._pagination.before = this._pagination.after;
        if (hasEnoughData)
            this._pagination.after = (0, index_1.bufferToUuid)(data[data.length - 1][this._pagination.idName]);
    }
    serialise(data, builder, url, idName) {
        const response = {
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
                    if (!this._pagination.size)
                        this._pagination.size = this._paginationCount;
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
            }
            else {
                delete response.links;
            }
        }
        let included = [];
        if (Array.isArray(data)) {
            const serialisedResults = data.map((item) => this.serialiseData(item, builder));
            response.data = serialisedResults.map((result) => result.serialisedData);
            included = [].concat(...serialisedResults.map((result) => result.includedElements));
        }
        else {
            const { serialisedData, includedElements } = this.serialiseData(data, builder);
            response.data = serialisedData;
            included = includedElements;
        }
        if (included.length > 0) {
            response.included = included;
        }
        return response;
    }
    serialiseData(data, builder) {
        const includedElements = [];
        const serialisedData = {
            type: builder.type,
        };
        if (typeof builder.id === "function") {
            serialisedData.id = builder.id(data);
        }
        else {
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
            }
            else {
                serialisedData.attributes[attribute] = data[attribute];
            }
        });
        if (builder.meta) {
            serialisedData.meta = {};
            Object.keys(builder.meta).forEach((meta) => {
                if (typeof builder.meta[meta] === "function") {
                    serialisedData.meta[meta] = builder.meta[meta](data);
                }
                else {
                    serialisedData.meta[meta] = data[meta];
                }
            });
        }
        if (builder.relationships) {
            serialisedData.relationships = {};
            Object.entries(builder.relationships).forEach((relationship) => {
                let resourceLinkage = {};
                if (relationship[1].resourceIdentifier) {
                    const minimalData = {
                        type: relationship[1].resourceIdentifier.type,
                    };
                    try {
                        if (typeof relationship[1].resourceIdentifier.id === "function") {
                            minimalData.id = relationship[1].resourceIdentifier.id(data);
                        }
                        else {
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
                    }
                    catch (e) { }
                }
                else if (data[relationship[0]]) {
                    const { minimalData, relationshipLink, additionalIncludeds } = this.serialiseRelationship(data[relationship[0]], relationship[1].data);
                    resourceLinkage = {
                        data: minimalData,
                    };
                    if (relationshipLink) {
                        resourceLinkage.links = relationshipLink;
                    }
                    else if (relationship[1].links) {
                        resourceLinkage.links = {
                            related: relationship[1].links.related(data),
                        };
                    }
                    if (relationship[1].included && additionalIncludeds.length > 0)
                        includedElements.push(...additionalIncludeds);
                    serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
                }
                else if (relationship[1].links) {
                    const related = relationship[1].links.related(data);
                    if (related) {
                        resourceLinkage.links = {
                            related: related,
                        };
                        serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
                    }
                }
            });
            if (Object.keys(serialisedData.relationships).length === 0)
                delete serialisedData.relationships;
        }
        return {
            serialisedData: serialisedData,
            includedElements: includedElements,
        };
    }
    serialiseRelationship(data, builder) {
        const response = {
            minimalData: undefined,
            relationshipLink: undefined,
            additionalIncludeds: [],
        };
        if (Array.isArray(data)) {
            const serialisedResults = data.map((item) => this.serialiseData(item, builder));
            const serialisedData = serialisedResults.map((result) => result.serialisedData);
            const includedElements = [].concat(...serialisedResults.map((result) => result.includedElements));
            response.minimalData = serialisedData.map((result) => {
                return { type: result.type, id: result.id };
            });
            response.additionalIncludeds = [].concat(...includedElements).concat(serialisedData);
        }
        else {
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
exports.JsonApiBuilder = JsonApiBuilder;
//# sourceMappingURL=JsonApiBuilder.js.map