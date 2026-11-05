#!/usr/bin/env bash
# Next.js 정적 export를 빌드해서 stage의 SiteBucket에 올린다.
# 사용: bash scripts/deploy-web.sh <dev|prod>
#   - 로컬: AWS 프로필 rosterush 사용 (AWS_PROFILE로 변경 가능)
#   - CI(CI=true): 환경변수 자격 증명 사용
set -euo pipefail

STAGE="${1:?usage: bash scripts/deploy-web.sh <dev|prod>}"
REGION="ap-northeast-2"
STACK="rosterush-${STAGE}"
AWS_ARGS=()
if [ -z "${CI:-}" ]; then AWS_ARGS=(--profile "${AWS_PROFILE:-rosterush}"); fi

cd "$(dirname "$0")/.."

output() {
  aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" "${AWS_ARGS[@]}" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(output SiteBucketName)"
DIST="$(output DistributionId)"
echo "stage=$STAGE bucket=$BUCKET distribution=$DIST"

pnpm --filter @rosterush/web build

# 1) 파일명에 해시가 붙은 정적 자산: 1년 immutable (이전 버전도 남겨서 열려 있는 탭이 깨지지 않게)
aws s3 sync web/out/_next/static "s3://$BUCKET/_next/static" "${AWS_ARGS[@]}" \
  --cache-control "public,max-age=31536000,immutable"

# 2) 나머지(HTML, RSC 페이로드 등): 항상 재검증
#    stats/는 로컬 집계 결과가 섞여 들어올 수 있으므로 제외 (운영 통계는 StatsBucket에서 서빙)
#    img/도 로컬 변환 결과이므로 제외 (운영 이미지는 ImagesBucket, scripts/upload-images.sh)
aws s3 sync web/out "s3://$BUCKET" "${AWS_ARGS[@]}" --delete \
  --exclude "_next/static/*" --exclude "stats/*" --exclude "img/*" \
  --cache-control "public,max-age=0,must-revalidate"

aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" "${AWS_ARGS[@]}" \
  --query "Invalidation.Id" --output text

echo "✓ web deployed to $STAGE"
