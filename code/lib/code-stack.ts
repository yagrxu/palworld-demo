import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CodeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // get account ID
    const accountId = cdk.Stack.of(this).account;
    // create S3 bucket
    const bucket = new s3.Bucket(this, `palworld-cdk-demo-${accountId}`, {
      // default is already blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      bucketName: `palworld-cdk-demo-${accountId}`,
    });

    // create a vpc
    const vpc = new cdk.aws_ec2.Vpc(this, 'Vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 1,
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

      vpcName: `palworld-cdk-demo-${accountId}`,
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

    //setup an ec2 instance in the vpc with default security group, using Ubuntu 20
    const instance = new cdk.aws_ec2.Instance(this, 'Instance', {
      vpc,
      ssmSessionPermissions: true,
      securityGroup: sg,
      instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.T3, cdk.aws_ec2.InstanceSize.XLARGE),
      machineImage: cdk.aws_ec2.MachineImage.genericLinux({
        'eu-central-1': 'ami-034ba8c038f8382f9',
        'us-east-1': 'ami-029bdee89471523f0',
        'ap-southeast-1': 'ami-0ccc5852bd53507bb',
      }),
      keyName: 'yagr-demo-sg',
      vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PUBLIC },
    });
    // instance.role.addManagedPolicy({
    //   managedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    // });
    const ssmDoc = new cdk.aws_ssm.CfnDocument(this, 'MySSMDocument', {
      name: 'MySSMDocument',
      documentType: 'Command',
      content: {
        schemaVersion: '2.2',
        description: 'Simple SSM Document',
        mainSteps: [
          {
            action: 'aws:runShellScript',
            name: 'runShellScript',
            inputs: {
              runCommand: ['echo "Hello from SSM!"'],
            },
          },
        ],
      },
    });
    // Create SSM association to run the document on the instance
    new cdk.aws_ssm.CfnAssociation(this, 'MySSMAssociation', {
      name: ssmDoc.name!,
      targets: [
        {
          key: 'InstanceIds',
          values: [instance.instanceId]
        }
      ],
      associationName: 'MySSMAssociation',
      // scheduleExpression: 'rate(5 minutes)', // adjust as needed
    });

  }
}
