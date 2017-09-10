export declare type FilterFn = (rootValue?: any, args?: any, context?: any, info?: any) => boolean;
export declare type ResolverFn = (rootValue?: any, args?: any, context?: any, info?: any) => AsyncIterator<any>;
export declare const withFilter: (asyncIteratorFn: () => AsyncIterator<any>, filterFn: FilterFn) => Function;
