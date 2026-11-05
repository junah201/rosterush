// serverless.yml build.esbuild.configFile — serverless.yml의 esbuild 설정과 합쳐진다
// .wasm import를 Uint8Array로 번들 (og 이미지용 resvg)
export default () => ({
  loader: { ".wasm": "binary" },
  // Lambda 런타임(nodejs24.x)에 맞춘다. 대상이 없으면(esnext) binary 로더가
  // Uint8Array.fromBase64(...)를 내보내는데 Node 24에는 없어서 og 함수가 시작 시 TypeError로 죽는다
  target: "node24",
});
