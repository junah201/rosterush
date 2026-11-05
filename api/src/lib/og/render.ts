import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori from "satori";
import { buildCard, type CardInput, OG_HEIGHT, OG_WIDTH } from "./card";
import { loadCardFonts } from "./fonts";

let ready: Promise<void> | undefined;

/** resvg wasm은 인스턴스당 한 번만 초기화한다 (실패하면 다음 요청에서 다시 시도) */
function initResvg(wasm: () => Uint8Array | Promise<Uint8Array>): Promise<void> {
  ready ??= Promise.resolve(wasm())
    .then((bytes) => initWasm(bytes))
    .catch((e) => {
      ready = undefined;
      throw e;
    });
  return ready;
}

/**
 * 카드 → PNG.
 * wasm 바이트는 호출하는 쪽이 준다 (Lambda는 esbuild binary 로더로 번들, 로컬 스크립트는 파일에서 읽음).
 */
export async function renderCardPng(
  input: CardInput,
  wasm: () => Uint8Array | Promise<Uint8Array>,
): Promise<Uint8Array> {
  const card = buildCard(input);
  const [{ fonts, bodyFamily }] = await Promise.all([
    loadCardFonts(input.lang, card.displayText, card.bodyText),
    initResvg(wasm),
  ]);
  card.node.props.style.fontFamily = bodyFamily;

  const svg = await satori(card.node as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "original" }, font: { loadSystemFonts: false } });
  try {
    const image = resvg.render();
    const png = image.asPng();
    image.free();
    return png;
  } finally {
    resvg.free();
  }
}
