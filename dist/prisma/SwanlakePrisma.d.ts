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
export declare const DEFAULT_PAGINATION_COUNT = 25;
export declare class SwanlakePrisma {
    static findAllGeneric<T>(model: (params: any) => Promise<T[]>, pagination?: PaginationInput, idFieldName?: string, options?: FindManyOptions): Promise<{
        data: T[];
        pagination?: PaginationInput;
    }>;
}
export declare const topLevelLinks: any;
export declare const prepareData: any;
