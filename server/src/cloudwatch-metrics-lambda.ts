import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";

import { sumAllValues, averageAllValues } from "./utils/format";

const region = "us-east-1";

const cloudwatch = new CloudWatchClient({ region });
const s3 = new S3Client({ region });
const cloudFront = new CloudFrontClient({ region });

const metric = (id: string, metricName: string, stat = "Average") => ({
  Id: id,
  MetricStat: {
    Metric: {
      Namespace: "AWS/CloudFront",
      MetricName: metricName,
      Dimensions: [
        {
          Name: "DistributionId",
          Value: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        },
        {
          Name: "Region",
          Value: "Global",
        },
      ],
    },
    Period: 3600,
    Stat: stat,
  },
  ReturnData: true,
});

export const handler = async () => {
  const params = {
    StartTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    EndTime: new Date(),
    MetricDataQueries: [
      metric("requests", "Requests", "Sum"),
      metric("bandwidth", "BytesDownloaded", "Sum"),
      metric("cacheHitRate", "CacheHitRate"),
      metric("errorRate", "TotalErrorRate"),
      metric("originLatency", "OriginLatency"),
    ],
  };
  try {
    const { MetricDataResults } = await cloudwatch.send(
      new GetMetricDataCommand(params),
    );

    const requests = MetricDataResults?.find(
      (metric) => metric.Id === "requests",
    );
    const bandwidth = MetricDataResults?.find(
      (metric) => metric.Id === "bandwidth",
    );
    const cacheHitRate = MetricDataResults?.find(
      (metric) => metric.Id === "cacheHitRate",
    );
    const errorRate = MetricDataResults?.find(
      (metric) => metric.Id === "5xxErrorRate",
    );
    const originLatency = MetricDataResults?.find(
      (metric) => metric.Id === "originLatency",
    );

    const data = {
      requests:
        requests && requests.Values ? sumAllValues(requests.Values) : null,
      bandwidth:
        bandwidth && bandwidth.Values ? sumAllValues(bandwidth.Values) : null,
      cacheHitRate:
        cacheHitRate && cacheHitRate.Values
          ? averageAllValues(cacheHitRate.Values)
          : null,
      originLatency:
        originLatency && originLatency.Values
          ? averageAllValues(originLatency.Values)
          : null,
      availability:
        100 -
        (errorRate && errorRate.Values
          ? averageAllValues(errorRate.Values)
          : 0),
    };

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `data/cloudfront-metrics.json`,
        Body: JSON.stringify(data),
        ContentType: "application/json",
        CacheControl: "public, max-age=3600",
      }),
    );

    await cloudFront.send(
      new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: 1,
            Items: ["/data/cloudfront-metrics.json"],
          },
        },
      }),
    );

    return data;
  } catch (error) {
    return error;
  }
};
