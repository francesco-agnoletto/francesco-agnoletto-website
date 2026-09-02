import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostAndUsageCommandInput,
} from "@aws-sdk/client-cost-explorer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

import { formatDate } from "./utils/format";

const region = "us-east-1";

const client = new CostExplorerClient({
  region,
});
const s3 = new S3Client({ region });
const cloudFront = new CloudFrontClient({ region });

const now = new Date();
const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

const servicesDictionary: Record<string, string> = {
  "Amazon Simple Storage Service": "S3",
  "AWS Lambda": "lambda",
  "CloudFront Flat-Rate Plans": "cloudfront (flat-rate)",
  AmazonCloudWatch: "cloudwatch",
  "AWS Cost Explorer": "AWS cost explorer",
  "Amazon Route 53": "hosted zone (flat-rate)",
};

export const handler = async () => {
  try {
    const commandParams: GetCostAndUsageCommandInput = {
      TimePeriod: {
        Start: formatDate(start),
        End: formatDate(end),
      },
      Metrics: ["UnblendedCost"],
      Granularity: "MONTHLY",
      GroupBy: [
        {
          Type: "DIMENSION",
          Key: "SERVICE",
        },
      ],
    };

    const cost = await client.send(new GetCostAndUsageCommand(commandParams));

    const data = {
      serviceBreakdown:
        cost.ResultsByTime?.[0]?.Groups?.map((group) => ({
          service: group.Keys?.[0] ?? "Unknown",
          amount: group.Metrics?.UnblendedCost?.Amount,
          unit: group.Metrics?.UnblendedCost?.Unit,
        })) ?? [],
    };

    const cleanData = Object.entries(servicesDictionary)
      .map(([service, label]) => ({
        service: label,
        amount:
          data.serviceBreakdown.find((item) => item.service === service)
            ?.amount ?? "0",
      }))
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `data/cost-metrics.json`,
        Body: JSON.stringify(cleanData),
        ContentType: "application/json",
        CacheControl: "public, max-age=86400",
      }),
    );

    await cloudFront.send(
      new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: 1,
            Items: ["/data/cost-metrics.json"],
          },
        },
      }),
    );

    return cleanData;
  } catch (error) {
    return error;
  }
};
