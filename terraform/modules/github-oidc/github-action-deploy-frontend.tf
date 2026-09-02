resource "aws_iam_role_policy" "github-action-deploy-francesco-agnoletto-com" {
  name = "github-actions-deploy-francesco-agnoletto.com"
  role = aws_iam_role.github-action-deploy-francesco-agnoletto-com.id

  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Sid : "BucketAccess",
        Effect : "Allow",
        Action : [
          "s3:ListBucket"
        ],
        Resource : var.frontend_bucket_arn
      },
      {
        Sid : "ObjectAccess",
        Effect : "Allow",
        Action : [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject"
        ],
        Resource : "${var.frontend_bucket_arn}/*"
      },
      {
        Effect : "Allow",
        Action : [
          "cloudfront:CreateInvalidation"
        ],
        Resource : var.cloudfront_distribution_arn
      }
    ]
  })
}

resource "aws_iam_role" "github-action-deploy-francesco-agnoletto-com" {
  name = "github-action-deploy-francesco-agnoletto.com"

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
            "token.actions.githubusercontent.com:sub" = "repo:francesco-agnoletto/francesco-agnoletto-website:ref:refs/heads/main/*"
          }
        }
      }
    ]
  })
}
