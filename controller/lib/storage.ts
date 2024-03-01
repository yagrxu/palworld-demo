import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {Construct} from "constructs";
import {AttributeType} from "aws-cdk-lib/aws-dynamodb";
import {Util} from "./util";
import {RemovalPolicy} from "aws-cdk-lib";


export class Storage {
    static createDynamoDbTables(scope: Construct){
        const serverTable = new dynamodb.Table(scope, 'ServerTable', {
            tableName: Util.TableName.get("server"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const serverNickNameMapping = new dynamodb.Table(scope, 'serverNickNameMapping', {
            tableName: Util.TableName.get("nickname"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'NickName', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const sessionTable = new dynamodb.Table(scope, 'sessionTable', {
            tableName: Util.TableName.get("session"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'StackName', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const userData = new dynamodb.Table(scope, 'userData', {
            tableName: Util.TableName.get("user"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'UserId', type: AttributeType.STRING},
            sortKey: {name: 'InstanceId', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const networks = new dynamodb.Table(scope, 'networks', {
            tableName: Util.TableName.get("networks"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'stackName', type: AttributeType.STRING},
            sortKey: {name: 'vpcId', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const cfManagement = new dynamodb.Table(scope, 'cfManagement', {
            tableName: Util.TableName.get("cf-mgmt"),
            pointInTimeRecovery: true,
            partitionKey: {name: 'stackName', type: AttributeType.STRING},
            deletionProtection: false,
            removalPolicy: RemovalPolicy.DESTROY,
        });
    }
}