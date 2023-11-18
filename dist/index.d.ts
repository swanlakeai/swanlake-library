/// <reference types="node" />
export { Imgix } from "./imgix/Imgix";
export { JsonApiNavigator } from "./jsonApi/JsonApiNavigator";
export { DEFAULT_PAGINATION_COUNT, FindManyOptions, PaginationInput, SwanlakePrisma, prepareData, topLevelLinks, } from "./prisma/SwanlakePrisma";
export { AuthModule } from "./auth/auth.module";
export { JwtAuthGuard } from "./auth/jwt-auth.guard";
export { JwtStrategy } from "./auth/jwt.strategy";
export { OptionalJwtAuthGuard } from "./auth/optional-jwt-auth.guard";
export { JsonApiBuilder } from "./jsonApi/JsonApiBuilder";
export { JsonApiDataInterface, transformFunction } from "./jsonApi/interfaces/JsonApiDataInterface";
export { Router } from "./routing/Router";
export declare function uuidToBuffer(uuid: string): Buffer;
export declare function bufferToUuid(buffer: Buffer): string;
export { AbstractApiData } from "./jsonApi/abstracts/AbstractApiData";
export { ApiDataFactory } from "./jsonApi/factories/ApiDataFactory";
export { ApiDataInterface } from "./jsonApi/interfaces/ApiDataInterface";
export { ApiResponseInterface } from "./jsonApi/interfaces/ApiResponseInterface";
export { JsonApiHydratedDataInterface } from "./jsonApi/interfaces/JsonApiHydratedDataInterface";
