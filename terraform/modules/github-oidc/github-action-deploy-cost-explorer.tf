resource "aws_iam_role_policy" "github-action-deploy-cost-explorer" {
  name = "github-action-deploy-cost-explorer"
  role = aws_iam_role.github-action-deploy-cost-explorer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid : "UpdateSpecificLambda",
        Effect : "Allow",
        Action : [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction"
        ],
        Resource : var.cost_explorer_lambda_arn
      }
    ]
  })
}

resource "aws_iam_role" "github-action-deploy-cost-explorer" {
  name = "github-action-deploy-cost-explorer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }

          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:francesco-agnoletto/francesco-agnoletto-website:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}
