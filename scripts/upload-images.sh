#!/usr/bin/env bash
# pnpm images:build 결과(web/public/img)를 stage의 ImagesBucket에 올린다.
# 사용: bash scripts/upload-images.sh <dev|prod>
#   - 로컬: AWS 프로필 rosterush 사용 (AWS_PROFILE로 변경 가능)
#   - CI(CI=true): 환경변수 자격 증명 사용
# 파일명이 내용 해시라서 immutable 캐시, --delete 없음 (예전 이미지를 쓰는 열린 탭이 깨지지 않게)
set -euo pipefail

STAGE="${1:?usage: bash scripts/upload-images.sh <dev|prod>}"
REGION="ap-northeast-2"
STACK="rosterush-${STAGE}"
AWS_ARGS=()
if [ -z "${CI:-}" ]; then AWS_ARGS=(--profile "${AWS_PROFILE:-rosterush}"); fi

cd "$(dirname "$0")/.."

if [ ! -d web/public/img ]; then
  echo "web/public/img 없음 — 먼저 pnpm images:build 실행" >&2
  exit 1
fi

BUCKET="$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" "${AWS_ARGS[@]}" \
  --query "Stacks[0].Outputs[?OutputKey=='ImagesBucketName'].OutputValue" --output text)"
echo "stage=$STAGE bucket=$BUCKET"

aws s3 sync web/public/img "s3://$BUCKET/img" "${AWS_ARGS[@]}" \
  --exclude "*" --include "*.webp" \
  --content-type "image/webp" \
  --cache-control "public,max-age=31536000,immutable"

echo "✓ images uploaded to $STAGE"
