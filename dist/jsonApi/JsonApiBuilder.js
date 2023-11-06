"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonApiBuilder = void 0;
const index_1 = require("../index");
class JsonApiBuilder {
    constructor(_configureRelationships) {
        this._configureRelationships = _configureRelationships;
        this._paginationCount = 25;
    }
    generatePagination(query) {
        const response = {};
        if (query.page["size"])
            response.size = query.page["size"];
        if (query.page["before"])
            response.before = query.page["before"];
        if (query.page["after"])
            response.after = query.page["after"];
        return response;
    }
    generateCursor(pagination) {
        const cursor = {
            cursor: undefined,
            take: this._paginationCount + 1,
        };
        if (!pagination)
            return cursor;
        if (pagination.size) {
            cursor.take = pagination.size;
        }
        if (pagination.before) {
            cursor.cursor = pagination.before;
            cursor.take = -((pagination.size ?? this._paginationCount) + 1);
        }
        else if (pagination.after) {
            cursor.cursor = pagination.after;
            cursor.take = (pagination.size ?? this._paginationCount) + 1;
        }
        return cursor;
    }
    updatePagination(pagination, data, idName) {
        if (!pagination.idName)
            pagination.idName = idName ?? "id";
        const hasEnoughData = data.length === (pagination?.size ? pagination.size + 1 : this._paginationCount + 1);
        if (!pagination.before && !pagination.after && hasEnoughData) {
            pagination.after = (0, index_1.bufferToUuid)(data[data.length - 1][pagination.idName]);
            return pagination;
        }
        if (pagination.before) {
            pagination.after = pagination.before;
            if (hasEnoughData)
                pagination.before = (0, index_1.bufferToUuid)(data[0][pagination.idName]);
            return pagination;
        }
        pagination.before = pagination.after;
        if (hasEnoughData)
            pagination.after = (0, index_1.bufferToUuid)(data[data.length - 1][pagination.idName]);
        return pagination;
    }
    serialise(data, builder, url, idName, pagination) {
        this._configureRelationships();
        const response = {
            links: {
                self: (process?.env?.URL ?? "") + url,
            },
            data: undefined,
        };
        if (url) {
            if (Array.isArray(data) && !pagination)
                pagination = {
                    size: this._paginationCount,
                };
            if (pagination && Array.isArray(data)) {
                pagination = this.updatePagination(pagination, data, idName);
                if (!pagination.size)
                    pagination.size = this._paginationCount;
                if (data.length === (pagination?.size ?? this._paginationCount + 1)) {
                    response.links.self =
                        url + (url.indexOf("?") === -1 ? "?" : "&") + `page[size]=${pagination.size.toString()}`;
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
        }
        else {
            delete response.links;
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
                if (data[relationship[0]]) {
                    const { minimalData, relationshipLink, additionalIncludeds } = this.serialiseRelationship(data[relationship[0]], relationship[1].data);
                    const resourceLinkage = {
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
                    serialisedData.relationships[relationship[1].name ?? relationship[0]] = resourceLinkage;
                    if (relationship[1].included && additionalIncludeds.length > 0)
                        includedElements.push(...additionalIncludeds);
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