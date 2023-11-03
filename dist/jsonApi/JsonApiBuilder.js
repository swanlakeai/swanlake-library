"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonApiBuilder = void 0;
class JsonApiBuilder {
    constructor(_configureRelationships) {
        this._configureRelationships = _configureRelationships;
    }
    serialise(data, builder) {
        this._configureRelationships();
        const response = {
            data: undefined,
        };
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
            if (typeof serialisedData.attributes[attribute] === "function") {
                serialisedData.attributes[attribute] = serialisedData.attributes[attribute](data);
            }
            else {
                serialisedData.attributes[attribute] = data[attribute];
            }
        });
        if (builder.meta) {
            serialisedData.meta = {};
            Object.keys(builder.meta).forEach((meta) => {
                if (typeof serialisedData.meta[meta] === "function") {
                    serialisedData.meta[meta] = serialisedData.meta[meta](data);
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