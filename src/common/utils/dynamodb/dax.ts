import {
    BatchGetItemCommand,
    BatchGetItemCommandOutput,
    BatchWriteItemCommand,
    BatchWriteItemCommandOutput,
    DeleteItemCommand,
    DeleteItemCommandOutput,
    DynamoDBClient,
    GetItemCommand,
    GetItemCommandOutput,
    PutItemCommand,
    PutItemCommandOutput,
    QueryCommand,
    ScanCommand,
    ScanCommandOutput,
    UpdateItemCommand,
    UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { Command } from '@smithy/smithy-client';
import * as AWS from 'aws-sdk';
import { logger } from '../logger';

const AmazonDaxClient = require('amazon-dax-client');

interface DaxConfig {
    endpoints?: (string | undefined)[];
    region?: string;
    requestTimeout?: number;
}

type CommandInput =
    | QueryCommand
    | GetItemCommand
    | ScanCommand
    | PutItemCommand
    | BatchGetItemCommand
    | UpdateItemCommand
    | DeleteItemCommand
    | BatchWriteItemCommand;

type CommandOutput<T> = T extends QueryCommand
    ? QueryCommandOutput
    : T extends GetItemCommand
    ? GetItemCommandOutput
    : T extends ScanCommand
    ? ScanCommandOutput
    : T extends PutItemCommand
    ? PutItemCommandOutput
    : T extends BatchGetItemCommand
    ? BatchGetItemCommandOutput
    : T extends UpdateItemCommand
    ? UpdateItemCommandOutput
    : T extends DeleteItemCommand
    ? DeleteItemCommandOutput
    : T extends BatchWriteItemCommand
    ? BatchWriteItemCommandOutput
    : never;

export class DaxClient extends DynamoDBClient {
    private dax?: typeof AmazonDaxClient;
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
                .filter((e) => !e || !e.trim().length)
                .map((e) => e?.trim());
            if (endpoints.length) {
                try {
                    this.dax = new AmazonDaxClient({
                        endpoints,
                        requestTimeout: params.dax.requestTimeout,
                        region: params.dax.region || params.region,
                    });
                    logger.debug('Dax:', { dax: this.dax });
                    this.docClient = new AWS.DynamoDB.DocumentClient({
                        service: this.dax,
                    });
                    logger.debug(this.dax, this.docClient);
                } catch (err) {
                    logger.error('Failed to start DAX', { err });
                }
            }
        }
    }

    private async daxSend<T extends Command<any, any, any, any, any>>(
        command: T
    ): Promise<
        | (T extends Command<infer Input, infer Output, any, any>
              ? Output
              : never)
        | undefined
    > {
        if (!this.docClient) {
            return undefined;
        }

        if (command instanceof QueryCommand) {
            return this.docClient
                .query(command.input as AWS.DynamoDB.QueryInput)
                .promise() as any;
        }
        if (command instanceof GetItemCommand) {
            return this.docClient
                .get(command.input as AWS.DynamoDB.GetItemInput)
                .promise() as any;
        }

        // If none of the above command types match
        return undefined;
    }

    async send<T extends Command<any, any, any, any, any>>(
        command: T
    ): Promise<
        T extends Command<any, infer Output, any, any, any> ? Output : never
    > {
        try {
            const daxResult = await this.daxSend(command);
            if (daxResult !== undefined) {
                return daxResult;
            }
        } catch (daxErr) {
            logger.warn(daxErr);
        }

        // Call the parent's send method.
        return super.send(command);
    }
}

const client = new DaxClient({} as any);
const result = await client.send(new QueryCommand());
