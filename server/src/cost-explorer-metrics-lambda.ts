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
const start = new Date(now.getFullYear(), now.getMonth(), 1);
const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

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

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `data/cost-metrics.json`,
        Body: JSON.stringify(data),
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

    return data;
  } catch (error) {
    return error;
  }
};
