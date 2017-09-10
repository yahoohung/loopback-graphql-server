import { PubSubEngine } from './pubsub-engine';
import { GraphQLSchema, GraphQLError } from 'graphql';
export declare class ValidationError extends Error {
    errors: Array<GraphQLError>;
    message: string;
    constructor(errors: any);
}
export interface SubscriptionOptions {
    query: string;
    operationName: string;
    callback: Function;
    variables?: {
        [key: string]: any;
    };
    context?: any;
    formatError?: Function;
    formatResponse?: Function;
}
export interface TriggerConfig {
    channelOptions?: Object;
    filter?: Function;
}
export interface TriggerMap {
    [triggerName: string]: TriggerConfig;
}
export interface SetupFunction {
    (options: SubscriptionOptions, args: {
        [key: string]: any;
    }, subscriptionName: string): TriggerMap;
}
export interface SetupFunctions {
    [subscriptionName: string]: SetupFunction;
}
export declare class SubscriptionManager {
    private pubsub;
    private schema;
    private setupFunctions;
    private subscriptions;
    private maxSubscriptionId;
    constructor(options: {
        schema: GraphQLSchema;
        setupFunctions: SetupFunctions;
        pubsub: PubSubEngine;
    });
    publish(triggerName: string, payload: any): void;
    subscribe(options: SubscriptionOptions): Promise<number>;
    unsubscribe(subId: any): void;
}
