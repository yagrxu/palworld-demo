import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {Construct} from "constructs";
import {AttributeType} from "aws-cdk-lib/aws-dynamodb";

export class Storage {
    static createDynamoDbTables(scope: Construct){
        const serverTable = new dynamodb.Table(scope, 'ServerTable', {
            tableName: 'server-table',
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false
        });
        const serverNickNameMapping = new dynamodb.Table(scope, 'serverNickNameMapping', {
            tableName: 'server-nick-name-mapping',
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'NickName', type: AttributeType.STRING},
            deletionProtection: false
        });
        const sessionTable = new dynamodb.Table(scope, 'sessionTable', {
            tableName: 'server-session',
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false
        });
        const userData = new dynamodb.Table(scope, 'userData', {
            tableName: 'user-data',
            pointInTimeRecovery: true,
            partitionKey: {name: 'UserId', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false
        });
        const networks = new dynamodb.Table(scope, 'networks', {
            tableName: 'networks',
            pointInTimeRecovery: true,
            partitionKey: {name: 'vpcId', type: AttributeType.STRING},
            deletionProtection: false
        });
    }

}