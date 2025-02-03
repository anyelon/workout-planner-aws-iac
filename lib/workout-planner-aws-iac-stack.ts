import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as path from 'path';

const APPSYNC_CERT_ARN = 'arn:aws:acm:us-east-1:825765426384:certificate/06c7226c-d932-4771-85ec-cfcc09f38b51';


export class WorkoutPlannerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get Certificate
    const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      "luna-gsd-cert",
      APPSYNC_CERT_ARN,
    );

    const appsyncDomainName = new appsync.CfnDomainName(
      this,
      'LunaGSDDomainName',
      {
        certificateArn: certificate.certificateArn,
        domainName: "api.luna-gsd.com",
      }
    );

    // Create the AppSync API
    const api = new appsync.GraphqlApi(this, 'WorkoutPlannerAppSyncAPI', {
      name: 'workout-planner-api',
      definition: appsync.Definition.fromFile(path.join(__dirname, 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365))
          }
        },
      },
    });

    const assoc = new appsync.CfnDomainNameApiAssociation(
      this,
      'WorkoutPlannerAppSyncAPIAssociation',
      {
        apiId: api.apiId,
        domainName: "api.luna-gsd.com",
      }
    );
    
    //  Required to ensure the resources are created in order
    assoc.addDependency(appsyncDomainName);

    // Output the GraphQL API URL and API Key
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: api.graphqlUrl
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: api.apiKey || ''
    });
  }
}
