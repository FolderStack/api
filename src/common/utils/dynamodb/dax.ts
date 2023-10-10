import {
    DynamoDBClient,
    GetItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { Command } from '@smithy/smithy-client';
import * as AWS from 'aws-sdk';
import { logger } from '../logger';

import { marshall } from '@aws-sdk/util-dynamodb';
import AmazonDaxClient from 'amazon-dax-client';
import _ from 'lodash';

enum ResultStatus {
    NO_CLIENT = 0,
    NOT_READ = 1,
    MISS = 2,
}

interface DaxConfig {
    endpoints?: (string | undefined)[];
    region?: string;
    requestTimeout?: number;
}

export class DaxClient extends DynamoDBClient {
    private dax?: AmazonDaxClient;
    private docClient?: AWS.DynamoDB.DocumentClient;

    constructor(
        params: ConstructorParameters<typeof DynamoDBClient>[0] & {
            dax: DaxConfig;
        }
    ) {
        super(params);

        logger.debug('Setting up dax client', params);
        if (params.dax?.endpoints) {
            const endpoints = params.dax.endpoints
                .filter((e) => e && e.trim().length)
                .map((e) => e?.trim()) as string[];

            if (endpoints.length) {
                try {
                    this.dax = new AmazonDaxClient({
                        endpoints,
                        region:
                            params.dax.region ||
                            params.region?.toString() ||
                            'ap-southeast-2',
                    });
                    this.docClient = new AWS.DynamoDB.DocumentClient({
                        service: this.dax as unknown as AWS.DynamoDB,
                    });
                    logger.debug('Connected to DAX');
                } catch (err) {
                    logger.error('Failed to start DAX', { err });
                }
            }
        }
    }

    private unwrapDynamoAttributes(obj: Record<string, any>): any {
        if (_.isObject(obj)) {
            if (_.size(obj) === 1 && _.has(obj, 'S')) {
                return obj.S;
            } else if (_.size(obj) === 1 && _.has(obj, 'N')) {
                return Number(obj.N);
            } else if (_.size(obj) === 1 && _.has(obj, 'BOOL')) {
                return Boolean(obj.BOOL);
            } else if (_.size(obj) === 1 && _.has(obj, 'M')) {
                return this.unwrapDynamoAttributes(obj.M);
            } else if (_.size(obj) === 1 && _.has(obj, 'L')) {
                return obj.L.map((item: any) =>
                    this.unwrapDynamoAttributes(item)
                );
            } else {
                // For other types or complex objects, recursively process each property
                return _.mapValues(obj, (value) =>
                    this.unwrapDynamoAttributes(value)
                );
            }
        }

        return obj;
    }

    private async daxSend<T extends Command<any, any, any, any, any>>(
        command: T
    ): Promise<
        | (T extends Command<any, infer Output, any, any> ? Output : never)
        | ResultStatus
    > {
        if (!this.docClient) {
            return ResultStatus.NO_CLIENT;
        }

        if (command instanceof QueryCommand) {
            const input = this.unwrapDynamoAttributes(
                _.cloneDeep(command.input)
            ) as AWS.DynamoDB.QueryInput;

            logger.debug('dax:Query', { input });

            const result = await this.docClient.query(input).promise();
            logger.debug('dax:hit', { input, result });
            result.Items = result.Items?.map((item) => marshall(item)) ?? [];
            return result as any;
        }

        if (command instanceof GetItemCommand) {
            const input = this.unwrapDynamoAttributes(
                _.cloneDeep(command.input)
            ) as AWS.DynamoDB.GetItemInput;

            logger.debug('dax:Get', { input });

            const result = await this.docClient.get(input).promise();
            logger.debug('dax:hit', { input, result });
            result.Item = marshall(result.Item);
            return result as any;
        }

        logger.debug('dax:Not a read command');

        // If none of the above command types match
        return ResultStatus.NOT_READ;
    }

    async send<T extends Command<any, any, any, any, any>>(
        command: T
    ): Promise<
        T extends Command<any, infer Output, any, any, any> ? Output : never
    > {
        try {
            logger.debug('dax:send', { command });
            const daxResult = await this.daxSend(command);
            if (typeof daxResult !== 'number') {
                logger.debug('dax:hit', { result: daxResult });
                return daxResult;
            }
        } catch (daxErr) {
            logger.debug('dax:error');
            logger.warn(daxErr);
        }
        logger.debug('dax:miss');

        // Call the parent's send method.
        return super.send(command);
    }
}
