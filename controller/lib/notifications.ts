import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import {Topic} from "aws-cdk-lib/aws-sns";
import {Construct} from "constructs";

export class Notifications{
    // create a SNS topic
    static createCfNotificationTopic(scope: Construct, topicName: string): Topic {
        return new Topic(scope, topicName, {
            displayName: topicName,
            fifo: false,
            topicName: topicName
        });
    }
    static createOpsNotificationTopic(scope: Construct, topicName: string): Topic {
        const topic = new Topic(scope, topicName, {
            displayName: topicName,
            fifo: false,
            topicName: topicName
        });
        topic.addSubscription(new subs.EmailSubscription(process.env.OPS_EMAIL || 'demo@example.com'));
        return topic;
    }
}