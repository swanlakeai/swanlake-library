"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToUuid = exports.uuidToBuffer = exports.OptionalJwtAuthGuard = exports.JwtStrategy = exports.JwtAuthGuard = exports.AuthModule = exports.topLevelLinks = exports.prepareData = exports.SwanlakePrisma = exports.DEFAULT_PAGINATION_COUNT = exports.JsonApiNavigator = exports.Imgix = void 0;
var Imgix_1 = require("./imgix/Imgix");
Object.defineProperty(exports, "Imgix", { enumerable: true, get: function () { return Imgix_1.Imgix; } });
var JsonApiNavigator_1 = require("./jsonApi/JsonApiNavigator");
Object.defineProperty(exports, "JsonApiNavigator", { enumerable: true, get: function () { return JsonApiNavigator_1.JsonApiNavigator; } });
var SwanlakePrisma_1 = require("./prisma/SwanlakePrisma");
Object.defineProperty(exports, "DEFAULT_PAGINATION_COUNT", { enumerable: true, get: function () { return SwanlakePrisma_1.DEFAULT_PAGINATION_COUNT; } });
Object.defineProperty(exports, "SwanlakePrisma", { enumerable: true, get: function () { return SwanlakePrisma_1.SwanlakePrisma; } });
Object.defineProperty(exports, "prepareData", { enumerable: true, get: function () { return SwanlakePrisma_1.prepareData; } });
Object.defineProperty(exports, "topLevelLinks", { enumerable: true, get: function () { return SwanlakePrisma_1.topLevelLinks; } });
var auth_module_1 = require("./auth/auth.module");
Object.defineProperty(exports, "AuthModule", { enumerable: true, get: function () { return auth_module_1.AuthModule; } });
var jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
Object.defineProperty(exports, "JwtAuthGuard", { enumerable: true, get: function () { return jwt_auth_guard_1.JwtAuthGuard; } });
var jwt_strategy_1 = require("./auth/jwt.strategy");
Object.defineProperty(exports, "JwtStrategy", { enumerable: true, get: function () { return jwt_strategy_1.JwtStrategy; } });
var optional_jwt_auth_guard_1 = require("./auth/optional-jwt-auth.guard");
Object.defineProperty(exports, "OptionalJwtAuthGuard", { enumerable: true, get: function () { return optional_jwt_auth_guard_1.OptionalJwtAuthGuard; } });
function uuidToBuffer(uuid) {
    const hex = uuid.replace(/-/g, "");
    return Buffer.from(hex, "hex");
}
exports.uuidToBuffer = uuidToBuffer;
function bufferToUuid(buffer) {
    const hex = buffer.toString("hex");
    const uuid = [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
    ].join("-");
    return uuid;
}
exports.bufferToUuid = bufferToUuid;
//# sourceMappingURL=index.js.map