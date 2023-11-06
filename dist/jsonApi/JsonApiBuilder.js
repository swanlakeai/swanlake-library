"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonApiBuilder = void 0;
require("dotenv").config();
const index_1 = require("../index");
class JsonApiBuilder {
    constructor(_configureRelationships, query) {
        this._configureRelationships = _configureRelationships;
        this._paginationCount = 25;
        this._pagination = {};
        this._url = process?.env?.URL ?? "";
        if (query?.["page[size]"])
            this._pagination.size = +query["page[size]"];
        if (query?.["page[before]"])
            this._pagination.before = query["page[before]"];
        if (query?.["page[after]"])
            this._pagination.after = query["page[after]"];
    }
    generateCursor() {
        const cursor = {
            cursor: undefined,
            take: this._paginationCount + 1,
        };
        if (this._pagination.size) {
            cursor.take = this._pagination.size;
        }
        if (this._pagination.before) {
            cursor.cursor = this._pagination.before;
            cursor.take = -((this._pagination.size ?? this._paginationCount) + 1);
        }
        else if (this._pagination.after) {
            cursor.cursor = this._pagination.after;
            cursor.take = (this._pagination.size ?? this._paginationCount) + 1;
        }
        return cursor;
    }
    updatePagination(data, idName) {
        if (!this._pagination.idName)
            this._pagination.idName = idName ?? "id";
        const hasEnoughData = data.length === (this._pagination?.size ? this._pagination.size + 1 : this._paginationCount + 1);
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
        this._configureRelationships();
        const response = {
            links: {
                self: this._url + url,
            },
            data: undefined,
        };
        if (Array.isArray(data) && data.length <= this._paginationCount + 1) {
            if (url) {
                if (Array.isArray(data) && !this._pagination)
                    this._pagination = {
                        size: this._paginationCount,
                    };
                if (this._pagination && Array.isArray(data)) {
                    this.updatePagination(data, idName);
                    if (!this._pagination.size)
                        this._pagination.size = this._paginationCount;
                    if (data.length === (this._pagination?.size ? this._pagination.size + 1 : this._paginationCount + 1)) {
                        response.links.self =
                            this._url +
                                url +
                                (url.indexOf("?") === -1 ? "?" : "&") +
                                `page[size]=${this._pagination.size.toString()}`;
                        if (this._pagination.after) {
                            response.links.next =
                                this._url +
                                    url +
                                    (url.indexOf("?") === -1 ? "?" : "&") +
                                    `page[size]=${this._pagination.size.toString()}&page[after]=${this._pagination.after}`;
                        }
                        data.splice(this._pagination.size, 1);
                    }
                    if (this._pagination.before) {
                        response.links.prev =
                            this._url +
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