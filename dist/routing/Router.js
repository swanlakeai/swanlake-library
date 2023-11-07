"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
class Router {
    static _microservices() {
        const keyValuePairs = process.env.API_VERSIONS.split(";").filter(Boolean);
        const result = new Map();
        for (const pair of keyValuePairs) {
            const [key, value] = pair.split(":");
            if (key && value) {
                result.set(key, value);
            }
        }
        return result;
    }
    static getUrl(microservice) {
        const url = process.env.API_URL;
        if (!microservice)
            return url;
        const versions = this._microservices();
        return `${url}v${versions.get(microservice)}/`;
    }
}
exports.Router = Router;
//# sourceMappingURL=Router.js.map