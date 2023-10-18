export { Imgix } from "./imgix/Imgix";
export { JsonApiNavigator } from "./jsonApi/JsonApiNavigator";
export {
	DEFAULT_PAGINATION_COUNT,
	FindManyOptions,
	PaginationInput,
	SwanlakePrisma,
	prepareData,
	topLevelLinks,
} from "./prisma/SwanlakePrisma";

export { AuthModule } from "./auth/auth.module";
export { JwtAuthGuard } from "./auth/jwt-auth.guard";
export { JwtStrategy } from "./auth/jwt.strategy";
export { OptionalJwtAuthGuard } from "./auth/optional-jwt-auth.guard";

export function uuidToBuffer(uuid: string): Buffer {
	const hex = uuid.replace(/-/g, "");
	return Buffer.from(hex, "hex");
}

export function bufferToUuid(buffer: Buffer): string {
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
