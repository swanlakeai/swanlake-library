"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Imgix = void 0;
const js_core_1 = __importDefault(require("@imgix/js-core"));
class Imgix {
    constructor(domain, token) {
        this._client = new js_core_1.default({
            domain: domain,
            secureURLToken: token,
        });
    }
    buildURL(path, params) {
        return this._client.buildURL(path, params);
    }
}
exports.Imgix = Imgix;
//# sourceMappingURL=Imgix.js.map