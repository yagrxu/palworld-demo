import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Util} from "./util";
import {Asset} from "aws-cdk-lib/aws-s3-assets";
import {Notifications} from "./notifications";
import {ApiFunction} from "./api-functions";
import {ControllerApi} from "./api";
import {Storage} from "./storage";
import * as iam from "aws-cdk-lib/aws-iam";

export class ControllerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // get account ID
    const accountId = cdk.Stack.of(this).account;
    const stackSuffix = (process.env.STACK_SUFFIX || id).toLowerCase()

    // create S3 bucket
    const backupBucket = Util.resolveS3Bucket(this, this.region, accountId);
    const serverTemplate = new Asset(this, 'server-template-v0.0.1', {
      path: 'cloudformation/template-server-v1.yaml',
    });
    const networksTemplate = new Asset(this, 'networks-template-v0.0.1', {
      path: 'cloudformation/template-networks-v1.yaml',
    });

    const cfCreationTopic = Notifications.createCfNotificationTopic(this, 'cf-creation-topic');
    const cfOpsTopic = Notifications.createOpsNotificationTopic(this, 'cf-callback-topic');
    ApiFunction.createCfCallbackHandler(this, 'cf-callback-handle-' + stackSuffix, cfCreationTopic, Util.TableName.get('networks') || 'networks');
    const findNetworkHandler = ApiFunction.createFindNextNetworkHandler(this, 'find-next-network-' + stackSuffix, Util.TableName.get('networks') || 'networks');
    const networksHandler = ApiFunction.createCfDeployFunction(this,
      'networks-deployer-' + stackSuffix,
      'cf-deployer.main',
      [
        new iam.PolicyStatement({
          actions: ['cloudformation:CreateStack'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['dynamodb:PutItem'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['SNS:Publish'],
          resources: [cfCreationTopic.topicArn]
        }),
        new iam.PolicyStatement({
          actions: ['ec2:*'],
          resources: ['*']
        }),
      ],
      {
        TOPIC_ARN: cfCreationTopic.topicArn,
        TEMPLATE_URL: networksTemplate.httpUrl,
        CF_MGMT_TABLE: Util.TableName.get("cf-mgmt"),
        TYPE: 'NETWORK'
      });
    const serversHandler = ApiFunction.createCfDeployFunction(this,
      'server-deployer-' + stackSuffix,
      'cf-deployer.main',
      [
        new iam.PolicyStatement({
          actions: ['cloudformation:CreateStack'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['dynamodb:PutItem'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['SNS:Publish'],
          resources: [cfCreationTopic.topicArn]
        }),
        new iam.PolicyStatement({
          actions: ['ec2:*'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['ssm:*'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: [
            'iam:CreateInstanceProfile',
            'iam:PutRolePolicy',
            'iam:RemoveRoleFromInstanceProfile',
            'iam:AddRoleToInstanceProfile',
            'iam:TagRole',
            'iam:PassRole',
            'iam:DeleteInstanceProfile',
            'iam:AttachRolePolicy',
            'iam:CreateRole',
            'iam:GetRole'
          ],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['lambda:*'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          actions: ['events:*'],
          resources: ['*']
        })
      ],
      {
        TOPIC_ARN: cfCreationTopic.topicArn,
        TEMPLATE_URL: serverTemplate.httpUrl,
        CF_MGMT_TABLE: Util.TableName.get("cf-mgmt"),
        TYPE: 'SERVER'
      });
    const api = ControllerApi.createApiGateway(this);
    ControllerApi.createServerApis(this, api, cfCreationTopic, serversHandler);
    serverTemplate.bucket.grantRead(serversHandler);
    ControllerApi.createNetworksApis(this, api, cfCreationTopic, networksHandler);
    networksTemplate.bucket.grantRead(networksHandler);
    ControllerApi.findNextSubnetApi(this, api, findNetworkHandler);

    // storage
    Storage.createDynamoDbTables(this);
  }
}
