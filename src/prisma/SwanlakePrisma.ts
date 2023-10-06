import { bufferToUuid, uuidToBuffer } from "..";

export type FindManyOptions = {
	where?: any;
	include?: any;
	orderBy?: any;
};

export type PaginationInput = {
	size?: number;
	after?: string;
	before?: string;
};

export const DEFAULT_PAGINATION_COUNT = 25;

export class SwanlakePrisma {
	static async findAllGeneric<T>(
		model: (params: any) => Promise<T[]>,
		pagination?: PaginationInput,
		idFieldName: string = "id",
		options?: FindManyOptions
	): Promise<{ data: T[]; pagination?: PaginationInput }> {
		if (pagination !== undefined) {
			if (pagination.size === undefined) pagination.size = DEFAULT_PAGINATION_COUNT;

			pagination.size = +pagination.size;
		} else {
			pagination = { size: DEFAULT_PAGINATION_COUNT };
		}

		const size: number = pagination?.size ?? DEFAULT_PAGINATION_COUNT;

		let cursor: any;
		let take = size + 1;

		if (pagination) {
			if (pagination.after) {
				cursor = {
					[idFieldName]: uuidToBuffer(pagination.after),
				};
			} else if (pagination.before) {
				cursor = {
					[idFieldName]: uuidToBuffer(pagination.before),
				};
				take = -take;
			}
		}

		const data: T[] = await model({
			...options,
			cursor: cursor,
			take: take,
		});

		if (pagination?.after) {
			const idField = (data[0] as any)[idFieldName];
			if (idField !== undefined) {
				pagination.before = bufferToUuid(idField as Buffer);
			} else {
				throw new Error("ID field is undefined");
			}
		}

		if (data.length === size + 1) {
			const idField = (data[size] as any)[idFieldName];
			if (idField !== undefined) {
				pagination.after = bufferToUuid(idField as Buffer);
			} else {
				throw new Error("ID field is undefined");
			}

			data.splice(size, 1);
		} else {
			pagination = undefined;
		}

		return { data, pagination };
	}
}

export const topLevelLinks: any = (url: string, pagination: PaginationInput) => {
	const links: any = {};

	if (pagination === undefined) {
		links.self = url;
	} else {
		links.self = function () {
			return (
				url + (url.indexOf("?") === -1 ? "?" : "&") + "page[size]=" + (pagination?.size ?? DEFAULT_PAGINATION_COUNT)
			);
		};

		if (pagination.after) {
			links.next = function () {
				return (
					url +
					(url.indexOf("?") === -1 ? "?" : "&") +
					"page[size]=" +
					(pagination.size ?? DEFAULT_PAGINATION_COUNT) +
					"&page[after]=" +
					pagination.after
				);
			};
		}

		if (pagination.before) {
			links.prev = function () {
				return (
					url +
					(url.indexOf("?") === -1 ? "?" : "&") +
					"page[size]=" +
					(pagination.size ?? DEFAULT_PAGINATION_COUNT) +
					"&page[before]=" +
					pagination.before
				);
			};
		}
	}

	return links;
};

export const prepareData: any = (data: any, id: string) => {
	let response: any;
	if (!Array.isArray(data)) {
		response = {
			...data,
			computedId: bufferToUuid(data[id]),
		};
	} else {
		response = data.map((element) => ({
			...element,
			computedId: bufferToUuid(element[id]),
		}));
	}
	return response;
};
