/// <reference types="node" />
export { Imgix } from "./imgix/Imgix";
export { JsonApiNavigator } from "./jsonApi/JsonApiNavigator";
export { DEFAULT_PAGINATION_COUNT, FindManyOptions, PaginationInput, SwanlakePrisma, prepareData, topLevelLinks, } from "./prisma/SwanlakePrisma";
export { AuthModule } from "./auth/auth.module";
export { JwtAuthGuard } from "./auth/jwt-auth.guard";
export { JwtStrategy } from "./auth/jwt.strategy";
export { OptionalJwtAuthGuard } from "./auth/optional-jwt-auth.guard";
export { JsonApiBuilder, configureRelationshipsFunction } from "./jsonApi/JsonApiBuilder";
export { JsonApiRelationshipBuilder } from "./jsonApi/JsonApiRelationshipBuilder";
export { JsonApiDataInterface, transformFunction } from "./jsonApi/interfaces/JsonApiDataInterface";
export { JsonApiRelationshipBuilderInterface } from "./jsonApi/interfaces/JsonApiRelationshipBuilderInterface";
export declare function uuidToBuffer(uuid: string): Buffer;
export declare function bufferToUuid(buffer: Buffer): string;
