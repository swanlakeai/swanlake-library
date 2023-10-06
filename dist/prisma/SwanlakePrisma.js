"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareData = exports.topLevelLinks = exports.SwanlakePrisma = exports.DEFAULT_PAGINATION_COUNT = void 0;
const __1 = require("..");
exports.DEFAULT_PAGINATION_COUNT = 25;
class SwanlakePrisma {
    static async findAllGeneric(model, pagination, idFieldName = "id", options) {
        if (pagination !== undefined) {
            if (pagination.size === undefined)
                pagination.size = exports.DEFAULT_PAGINATION_COUNT;
            pagination.size = +pagination.size;
        }
        else {
            pagination = { size: exports.DEFAULT_PAGINATION_COUNT };
        }
        const size = pagination?.size ?? exports.DEFAULT_PAGINATION_COUNT;
        let cursor;
        let take = size + 1;
        if (pagination) {
            if (pagination.after) {
                cursor = {
                    [idFieldName]: (0, __1.uuidToBuffer)(pagination.after),
                };
            }
            else if (pagination.before) {
                cursor = {
                    [idFieldName]: (0, __1.uuidToBuffer)(pagination.before),
                };
                take = -take;
            }
        }
        const data = await model({
            ...options,
            cursor: cursor,
            take: take,
        });
        if (pagination?.after) {
            const idField = data[0][idFieldName];
            if (idField !== undefined) {
                pagination.before = (0, __1.bufferToUuid)(idField);
            }
            else {
                throw new Error("ID field is undefined");
            }
        }
        if (data.length === size + 1) {
            const idField = data[size][idFieldName];
            if (idField !== undefined) {
                pagination.after = (0, __1.bufferToUuid)(idField);
            }
            else {
                throw new Error("ID field is undefined");
            }
            data.splice(size, 1);
        }
        else {
            pagination = undefined;
        }
        return { data, pagination };
    }
}
exports.SwanlakePrisma = SwanlakePrisma;
const topLevelLinks = (url, pagination) => {
    const links = {};
    if (pagination === undefined) {
        links.self = url;
    }
    else {
        links.self = function () {
            return (url + (url.indexOf("?") === -1 ? "?" : "&") + "page[size]=" + (pagination?.size ?? exports.DEFAULT_PAGINATION_COUNT));
        };
        if (pagination.after) {
            links.next = function () {
                return (url +
                    (url.indexOf("?") === -1 ? "?" : "&") +
                    "page[size]=" +
                    (pagination.size ?? exports.DEFAULT_PAGINATION_COUNT) +
                    "&page[after]=" +
                    pagination.after);
            };
        }
        if (pagination.before) {
            links.prev = function () {
                return (url +
                    (url.indexOf("?") === -1 ? "?" : "&") +
                    "page[size]=" +
                    (pagination.size ?? exports.DEFAULT_PAGINATION_COUNT) +
                    "&page[before]=" +
                    pagination.before);
            };
        }
    }
    return links;
};
exports.topLevelLinks = topLevelLinks;
const prepareData = (data, id) => {
    let response;
    if (!Array.isArray(data)) {
        response = {
            ...data,
            computedId: (0, __1.bufferToUuid)(data[id]),
        };
    }
    else {
        response = data.map((element) => ({
            ...element,
            computedId: (0, __1.bufferToUuid)(element[id]),
        }));
    }
    return response;
};
exports.prepareData = prepareData;
//# sourceMappingURL=SwanlakePrisma.js.map