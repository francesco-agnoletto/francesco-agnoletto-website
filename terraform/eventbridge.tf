// daily trigger for cloudwatch metrics lambda function
resource "aws_cloudwatch_event_rule" "cloudwatch_metrics_daily" {
  name                = "set-daily-usage"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "cloudwatch_metrics_daily" {
  rule = aws_cloudwatch_event_rule.cloudwatch_metrics_daily.name

  arn = aws_lambda_function.francesco-agnoletto-cloudwatch-metrics-lambda.arn
}

resource "aws_lambda_permission" "allow_daily_metrics_trigger" {
  statement_id = "lambda-7779ec38-c3fe-45fd-bb3c-f5d4e321bf3b"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.francesco-agnoletto-cloudwatch-metrics-lambda.function_name

  principal = "events.amazonaws.com"

  source_arn = aws_cloudwatch_event_rule.cloudwatch_metrics_daily.arn
}

// weekly trigger for cost explorer lambda function
resource "aws_cloudwatch_event_rule" "cost_explorer_weekly" {
  name                = "fetch-weekly-usage"
  schedule_expression = "rate(7 days)"
}

resource "aws_cloudwatch_event_target" "cost_explorer_weekly" {
  rule = aws_cloudwatch_event_rule.cost_explorer_weekly.name

  arn = aws_lambda_function.francesco-agnoletto-cost-explorer-lambda.arn
}

resource "aws_lambda_permission" "allow_weekly_cost_trigger" {
  statement_id = "lambda-dd067fc1-dafb-4866-88b2-85dd38d30723"

  action = "lambda:InvokeFunction"

  function_name = aws_lambda_function.francesco-agnoletto-cost-explorer-lambda.function_name

  principal = "events.amazonaws.com"

  source_arn = aws_cloudwatch_event_rule.cost_explorer_weekly.arn
}
