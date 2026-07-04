resource "aws_lambda_function" "francesco-agnoletto-cost-explorer-lambda" {
  filename      = "cost-explorer-metrics-lambda.zip"
  function_name = "francesco-agnoletto-lambda-cost"
  description   = "cloudwatch daily cost for francesco-agnoletto"
  role          = aws_iam_role.francesco-agnoletto-cost-explorer-lambda-role.arn
  handler       = "cost-explorer-metrics-lambda.handler"
  runtime       = "nodejs24.x"

  environment {
    variables = {
      S3_BUCKET_NAME             = aws_s3_bucket.francesco-agnoletto-bucket.bucket
      CLOUDFRONT_DISTRIBUTION_ID = module.hosting.aws_cloudfront_distribution_id
    }
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }
}

resource "aws_iam_role_policy" "francesco-agnoletto-cost-explorer-lambda-policy" {
  name = "cost-explorer-get-metrics"
  role = aws_iam_role.francesco-agnoletto-cost-explorer-lambda-role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid : "CostExplorerRead",
        Effect : "Allow",
        Action : [
          "ce:GetCostAndUsage"
        ],
        Resource : "*"
      },
      {
        Effect : "Allow",
        Action : "s3:PutObject",
        Resource : "${aws_s3_bucket.francesco-agnoletto-bucket.arn}/data/cost-metrics.json"
      },
      {
        Effect : "Allow",
        Action : "cloudfront:CreateInvalidation",
        Resource : "${module.hosting.aws_cloudfront_distribution_arn}"
      }
    ]
  })
}

resource "aws_iam_role" "francesco-agnoletto-cost-explorer-lambda-role" {
  name = "francesco-agnoletto-lambda-cost-role-i0vbwff8"
  path = "/service-role/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}

// Automatic logs permissions for lambda functions
// this is required to allow the lambda function to write logs to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "cost_explorer_logs" {
  role       = aws_iam_role.francesco-agnoletto-cost-explorer-lambda-role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "cost-explorer-metrics-log-group" {
  name = "/aws/lambda/${aws_lambda_function.francesco-agnoletto-cost-explorer-lambda.function_name}"

  retention_in_days = 30
}
