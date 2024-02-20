import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Util} from "./util";
import {Asset} from "aws-cdk-lib/aws-s3-assets";
import {Notifications} from "./notifications";
import {ApiFunction} from "./api-functions";
import {ControllerApi} from "./api";
import {Storage} from "./storage";

export class ControllerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // get account ID
    const accountId = cdk.Stack.of(this).account;

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
    ApiFunction.createCfCallbackHandler(this, cfOpsTopic);
    ControllerApi.createServerApis(this, cfCreationTopic);
    // serverTemplate.bucket.grantRead()
    // bucket.grantReadWrite(handler);

    // storage
    Storage.createDynamoDbTables(this);

  }
}
