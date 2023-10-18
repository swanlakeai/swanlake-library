"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalJwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let OptionalJwtAuthGuard = class OptionalJwtAuthGuard extends (0, passport_1.AuthGuard)("jwt") {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.headers.authorization) {
            return true;
        }
        try {
            return (await super.canActivate(context));
        }
        catch (error) {
            return false;
        }
    }
    handleRequest(err, user, info, context, status) {
        if (err || !user) {
            return null;
        }
        return user;
    }
};
exports.OptionalJwtAuthGuard = OptionalJwtAuthGuard;
exports.OptionalJwtAuthGuard = OptionalJwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], OptionalJwtAuthGuard);
//# sourceMappingURL=optional-jwt-auth.guard.js.map