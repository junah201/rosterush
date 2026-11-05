// serverless.yml build.esbuild.configFile — serverless.yml의 esbuild 설정과 합쳐진다
// .wasm import를 Uint8Array로 번들 (og 이미지용 resvg)
export default () => ({
  loader: { ".wasm": "binary" },
});
