import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_ec2} from "aws-cdk-lib";
import {BootstrapContent} from "./bootstrap";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';


export class CodeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, privateProps : PrivateProps, props?: cdk.StackProps) {
    super(scope, id, props);
    // get account ID
    const accountId = cdk.Stack.of(this).account;

    // create S3 bucket
    const bucket = BootstrapContent.resolveS3Bucket(this, this.region, accountId, privateProps);

    // create a vpc
    const vpc = new cdk.aws_ec2.Vpc(this, 'Vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      vpcName: `palworld-cdk-demo-${this.region}`,
    });

    // create a security group
    const sg = new cdk.aws_ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow SSH (TCP port 22) in',
      allowAllOutbound: true,
      securityGroupName: `palworld-cdk-demo-${accountId}`,
    });

    sg.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(22), 'Allow SSH Access');
    sg.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(8211), 'Allow 8211 tcp Access');
    sg.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.udp(8211), 'Allow 8211 udp Access');

    // create an EIP
    const eip = new cdk.aws_ec2.CfnEIP(this, 'server-eip');

    //set up an ec2 instance in the vpc with default security group, using Ubuntu 20
    const instance = new cdk.aws_ec2.Instance(this, 'Instance', {
      vpc,
      instanceName: privateProps.serverName,
      ssmSessionPermissions: true,
      securityGroup: sg,
      instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.M6I, cdk.aws_ec2.InstanceSize.XLARGE),
      machineImage: cdk.aws_ec2.MachineImage.lookup({
        name: 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20240126'
      }),
      keyPair: BootstrapContent.resolveKeyPair(this, this.region, privateProps),
      vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PUBLIC },
    });
    instance.role.addManagedPolicy({
       managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
    });

    new aws_ec2.CfnEIPAssociation(this, 'server-eip-association', {
      allocationId: eip.attrAllocationId,
      instanceId: instance.instanceId
    })
    BootstrapContent.bootstrapCommand[1] = BootstrapContent.bootstrapCommand[1].replace('[BUCKET_NAME]', bucket.bucketName)
    new cdk.aws_ssm.CfnDocument(this, 'MySSMDocument', {
      name: 'bootstrap-document',
      documentType: 'Command',
      content: {
        schemaVersion: '2.2',
        description: 'Simple SSM Document',
        mainSteps: [
          {
            action: 'aws:runShellScript',
            name: 'runShellScript',
            inputs: {
              runCommand: BootstrapContent.bootstrapCommand,
            },
          },
        ],
      },
    });
    // Create SSM association to run the document on the instance
    new cdk.aws_ssm.CfnAssociation(this, 'MySSMAssociation', {
      name: 'bootstrap-document',
      targets: [
        {
          key: 'InstanceIds',
          values: [instance.instanceId]
        }
      ],
      associationName: 'bootstrap-association',
    });

    new cdk.aws_ssm.CfnDocument(this, 'RestoreDocument', {
      name: 'restore-document',
      documentType: 'Command',
      content: {
        schemaVersion: '2.2',
        description: 'Restore Document',
        parameters: {
          timestamp: {
            type: 'String',
            description: 'timestamp for restore data, get saved data no later than this time'
          }
        },
        mainSteps: [
          {
            action: 'aws:runShellScript',
            name: 'runShellScript',
            inputs: {
              runCommand: [
                'cd /palworld-server/Pal/Saved/SaveGames',
                'current_time=$(date +%s)',
                'restore_time=$(({{ timestamp }} / 1800 * 1800))',
                'sudo zip -r restore-backup-${current_time}.zip ./',
                `s3path=s3://${bucket.bucketName}/${instance.instanceId}`,
                'aws s3 cp ./restore-backup-${current_time}.zip ${s3path}/restore-backup-${current_time}.zip',
                'aws s3 cp ${s3path}/${restore_time}.zip /palworld-server/Pal/Saved/SaveGames/restore-file.zip',
                'sudo rm -rf /palworld-server/Pal/Saved/SaveGames/*',
                'sudo unzip /palworld-server/Pal/Saved/SaveGames/restore-file.zip',
                'sudo rm /palworld-server/Pal/Saved/SaveGames/restore-file.zip'
              ],
            },
          },
        ],
      },
    });
    const backupDoc = new cdk.aws_ssm.CfnDocument(this, 'BackupDocument', {
      name: 'backup-document',
      documentType: 'Command',
      content: {
        schemaVersion: '2.2',
        description: 'Backup Document',
        mainSteps: [
          {
            action: 'aws:runShellScript',
            name: 'runShellScript',
            inputs: {
              runCommand: [
                  'cd /palworld-server/Pal/Saved/SaveGames',
                  'current_time=$(date +%s)',
                  'rounded_time=$((current_time / 1800 * 1800))',
                  'formatted_time=$(date -d "@$rounded_time" "+%Y-%m-%d %H:%M:%S %Z" -u)',

                  'sudo zip -r ${rounded_time}.zip ./',
                  `s3path=s3://${bucket.bucketName}/${instance.instanceId}`,
                  'aws s3 cp ./${rounded_time}.zip ${s3path}/${rounded_time}.zip'
              ],
            },
          },
        ],
      },
    });

    const backupScheduler = new lambda.Function(this, 'controller-main', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('resources'),
      handler: 'backup-scheduler.main',
      environment: {
        region: this.region
      },
      initialPolicy: [
        // Define your initial IAM policy statements here
        new iam.PolicyStatement({
          actions: ['ssm:*'],
          resources: ['*']
        }),
      ],
    });
    //   #!/bin/bash
    // # Convert timestamp to human-readable format in +8 timezone
    //   formatted_time=$(date -d "@$rounded_time" "+%Y-%m-%d %H:%M:%S %Z" -u)
    //   echo "Human-readable time in +8 timezone: $formatted_time"

    new Rule(this, 'Rule', {
      description: "Schedule a Lambda that creates a report every 1st of the month",
      schedule: Schedule.cron({
        year: "*",
        month: "*",
        day: "*",
        hour: "*",
        minute: "*/30",
      }),
      targets: [new LambdaFunction(backupScheduler, {
        event: events.RuleTargetInput.fromObject({ instanceId: instance.instanceId, documentName: backupDoc.name })
      })],
    });

    // Restore API
    const restoreFunction = new lambda.Function(this, 'restoreFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('resources'),
      handler: 'restore.main',
      environment: {},
      initialPolicy: [
        // Define your initial IAM policy statements here
        new iam.PolicyStatement({
          actions: ['ssm:*'],
          resources: ['*']
        }),
      ],
    });

    bucket.grantReadWrite(restoreFunction);

    const serverApi = new apigateway.RestApi(this, 'server-operation-apigw', {
      restApiName: 'Service Operation API',
      description: 'This service serves server operations.'
    });

    const restoreApi = new apigateway.LambdaIntegration(restoreFunction, {
      requestTemplates: {'application/json': '{ "statusCode": "200" }'}
    });

    serverApi.root.addMethod('POST', restoreApi);

  }
}
export interface PrivateProps {
  readonly createKeyPair: string;
  readonly createBucket: string;
  readonly bucketName: string | undefined;
  readonly serverName: string | undefined;
}