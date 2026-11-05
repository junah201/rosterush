// esbuild `loader: { ".wasm": "binary" }` (api/esbuild.config.js) → 파일 내용이 Uint8Array로 들어온다
declare module "*.wasm" {
  const bytes: Uint8Array;
  export default bytes;
}
