import type { Lang } from "@rosterush/core";
import type { PolicyDoc, Ymd } from "./common";

/**
 * 서비스 이용약관 본문.
 * 운영 조치(의심 기록 제외, 요청 제한)는 api/src/lib/check-run.ts·ratelimit.ts의 실제 동작과 맞춘다.
 * 내용을 바꾸면 EFFECTIVE를 올릴 것.
 */

const EFFECTIVE: Ymd = { y: 2026, m: 11, d: 6 };

export const terms: Record<Lang, PolicyDoc> = {
  ko: {
    title: "서비스 이용약관",
    description: "Rosterush를 이용할 때 지켜 주셨으면 하는 약속과 운영 방식을 알려 드려요.",
    effective: EFFECTIVE,
    intro:
      "Rosterush를 이용하면 이 약관에 동의한 것으로 봐요. 쉽게 쓰려고 했으니 한 번 읽어 주세요.",
    summaryTitle: "한눈에 보기",
    summary: [
      "회원가입 없이 누구나 무료로 이용할 수 있어요.",
      "다른 사람을 불쾌하게 하는 댓글이나 기록 조작은 하지 마세요.",
      "게임 캐릭터의 이름과 이미지는 각 게임사의 것이에요.",
    ],
    notice:
      "Rosterush는 팬이 만든 비공식 사이트예요. 소개하는 게임의 개발사·배급사와 관계가 없어요.",
    sections: [
      {
        title: "1. 서비스 내용",
        items: [
          "게임 캐릭터 이름을 제한 시간 안에 맞히는 퀴즈를 무료로 제공해요.",
          "기록 저장, 상위 % 통계, 기록 공유, 댓글 기능을 쓸 수 있어요.",
          "더 나은 서비스를 위해 기능이나 게임 목록이 바뀌거나 없어질 수 있어요.",
        ],
      },
      {
        title: "2. 이런 행동은 하지 마세요",
        items: [
          "욕설, 혐오 표현, 다른 사람을 괴롭히는 댓글",
          "다른 사람의 개인정보를 올리는 일",
          "광고나 같은 내용을 반복해서 올리는 도배",
          "프로그램을 써서 기록을 조작하거나 요청을 대량으로 보내는 일",
          "다른 사람이나 운영자인 척하는 닉네임",
        ],
      },
      {
        title: "3. 운영자가 할 수 있는 조치",
        items: [
          "2번을 어긴 댓글과 공유 기록은 미리 알리지 않고 지우거나 가릴 수 있어요.",
          "조작이 의심되는 기록은 통계에서 빼고, 공유할 수 없게 해요.",
          "같은 곳에서 요청이 너무 많이 오면 잠시 이용을 제한해요.",
        ],
      },
      {
        title: "4. 내가 올린 댓글과 기록",
        items: [
          "댓글과 닉네임에 대한 책임은 작성한 사람에게 있어요.",
          "공유 기록과 댓글은 누구나 볼 수 있어요. 운영자는 이를 Rosterush 안에서 보여주는 데만 써요.",
          "댓글은 작성할 때 정한 비밀번호로 직접 수정·삭제할 수 있어요. 비밀번호를 잊었다면 아래 이메일로 알려 주세요.",
        ],
      },
      {
        title: "5. 권리",
        items: [
          "캐릭터 이름, 이미지 같은 각 게임의 콘텐츠 권리는 해당 게임사에 있어요.",
          "권리자가 삭제를 요청하면 확인하는 대로 내려요.",
          "그 밖의 Rosterush 디자인과 프로그램의 권리는 운영자에게 있어요.",
        ],
      },
      {
        title: "6. 책임의 한계",
        items: [
          "서비스는 무료로, 지금 모습 그대로 제공해요. 오류가 없거나 언제나 이용할 수 있다고 보장하지 않아요.",
          "기록이나 통계가 사라지거나 틀려서 생긴 손해는 법이 허용하는 범위에서 책임지지 않아요.",
          "플레이 기록은 30일 뒤 자동으로 지워져요.",
        ],
      },
      {
        title: "7. 개인정보",
        items: ["이용자의 정보는 개인정보 처리방침에 따라 다뤄요."],
        link: { path: "/privacy/", label: "개인정보 처리방침 보기" },
      },
      {
        title: "8. 약관이 바뀔 때",
        items: [
          "약관을 바꾸면 이 페이지에 바뀐 내용과 적용 날짜를 올려요.",
          "바뀐 뒤에도 계속 이용하면 바뀐 약관에 동의한 것으로 봐요.",
        ],
      },
      {
        title: "9. 분쟁 해결",
        items: [
          "이 약관은 대한민국 법을 따라요.",
          "분쟁이 생기면 먼저 이메일로 대화해 풀고, 그래도 안 되면 대한민국 법원에서 해결해요.",
        ],
      },
    ],
    contact: { title: "10. 운영자와 문의처", person: "운영자", email: "이메일" },
  },
  ja: {
    title: "利用規約",
    description: "Rosterushを利用するときに守っていただきたいことと、運営の方針をご案内します。",
    effective: EFFECTIVE,
    intro:
      "Rosterushを利用すると、この規約に同意したものとみなします。わかりやすく書いたので、一度読んでみてください。",
    summaryTitle: "ひと目でわかるポイント",
    summary: [
      "会員登録なしで、誰でも無料で利用できます。",
      "人を不快にさせるコメントや記録の改ざんはしないでください。",
      "ゲームキャラの名前と画像は、各ゲーム会社のものです。",
    ],
    notice:
      "Rosterushはファンが作った非公式サイトです。紹介しているゲームの開発元・販売元とは関係ありません。",
    sections: [
      {
        title: "1. サービス内容",
        items: [
          "ゲームキャラの名前を制限時間内に答えるクイズを無料で提供します。",
          "記録の保存、上位%の統計、記録のシェア、コメント機能を使えます。",
          "より良いサービスのため、機能やゲームの一覧が変わったり、なくなったりすることがあります。",
        ],
      },
      {
        title: "2. 禁止していること",
        items: [
          "悪口、差別的な表現、人を攻撃するコメント",
          "他人の個人情報を書き込むこと",
          "宣伝や、同じ内容をくり返し投稿する連投",
          "プログラムを使った記録の改ざんや、大量のリクエスト送信",
          "他人や運営者になりすましたニックネーム",
        ],
      },
      {
        title: "3. 運営者が行う措置",
        items: [
          "2に反するコメントやシェア記録は、予告なく削除または非表示にすることがあります。",
          "改ざんが疑われる記録は統計から除き、シェアできないようにします。",
          "同じ場所から大量のリクエストが来た場合は、一時的に利用を制限します。",
        ],
      },
      {
        title: "4. 投稿したコメントと記録",
        items: [
          "コメントとニックネームの責任は、投稿した本人にあります。",
          "シェア記録とコメントは誰でも見られます。運営者はこれらをRosterushの中で表示するためだけに使います。",
          "コメントは投稿時に決めたパスワードで編集・削除できます。パスワードを忘れた場合は、下記のメールでお知らせください。",
        ],
      },
      {
        title: "5. 権利",
        items: [
          "キャラの名前や画像など、各ゲームのコンテンツの権利はそれぞれのゲーム会社にあります。",
          "権利者から削除の依頼があれば、確認しだい取り下げます。",
          "それ以外のRosterushのデザインとプログラムの権利は運営者にあります。",
        ],
      },
      {
        title: "6. 責任の範囲",
        items: [
          "サービスは無料で、現状のまま提供します。エラーがないことや、いつでも利用できることは保証しません。",
          "記録や統計が消えたり誤っていたりして生じた損害について、法律で認められる範囲で責任を負いません。",
          "プレイ記録は30日後に自動で削除されます。",
        ],
      },
      {
        title: "7. 個人情報",
        items: ["利用者の情報は、プライバシーポリシーに従って取り扱います。"],
        link: { path: "/privacy/", label: "プライバシーポリシーを見る" },
      },
      {
        title: "8. 規約の変更",
        items: [
          "規約を変更する場合は、変更内容と施行日をこのページに掲載します。",
          "変更後も利用を続けた場合は、変更後の規約に同意したものとみなします。",
        ],
      },
      {
        title: "9. 紛争の解決",
        items: [
          "この規約は大韓民国の法律に従います。",
          "紛争が起きた場合はまずメールで話し合い、解決しない場合は大韓民国の裁判所で解決します。",
        ],
      },
    ],
    contact: { title: "10. 運営者とお問い合わせ先", person: "運営者", email: "メール" },
  },
  en: {
    title: "Terms of Service",
    description: "The ground rules for using Rosterush, and how we run it.",
    effective: EFFECTIVE,
    intro:
      "By using Rosterush, you agree to these terms. We've kept them short and plain, so please give them a read.",
    summaryTitle: "At a glance",
    summary: [
      "Anyone can play for free, no account needed.",
      "Don't post hurtful comments or fake your runs.",
      "Character names and images belong to each game's publisher.",
    ],
    notice:
      "Rosterush is an unofficial fan site. It isn't affiliated with the developers or publishers of the games it features.",
    sections: [
      {
        title: "1. What Rosterush offers",
        items: [
          "A free quiz where you name game characters before time runs out.",
          "Saved runs, percentile stats, shareable runs and comments.",
          "Features and the list of games may change or be removed as we improve the site.",
        ],
      },
      {
        title: "2. Please don't",
        items: [
          "Post insults, hate speech, or comments that harass others",
          "Share someone else's personal information",
          "Post ads or spam the same thing over and over",
          "Use programs to fake runs or flood the site with requests",
          "Use a nickname that impersonates someone else or the operator",
        ],
      },
      {
        title: "3. What we may do",
        items: [
          "Remove or hide comments and shared runs that break section 2, without notice.",
          "Leave suspected fake runs out of stats and block them from being shared.",
          "Temporarily limit access when too many requests come from one place.",
        ],
      },
      {
        title: "4. Your comments and runs",
        items: [
          "You're responsible for your comments and nickname.",
          "Shared runs and comments are visible to everyone. We only use them to show them on Rosterush.",
          "You can edit or delete a comment with the password you set. If you forgot it, email us below.",
        ],
      },
      {
        title: "5. Ownership",
        items: [
          "Character names, images and other game content belong to their publishers.",
          "If a rights holder asks us to remove something, we'll take it down once we've confirmed the request.",
          "Everything else about Rosterush, including its design and code, belongs to the operator.",
        ],
      },
      {
        title: "6. Limits of liability",
        items: [
          "Rosterush is free and provided as is. We don't promise it will be error-free or always available.",
          "To the extent the law allows, we aren't liable for losses caused by runs or stats that go missing or are wrong.",
          "Game runs are deleted automatically after 30 days.",
        ],
      },
      {
        title: "7. Privacy",
        items: ["We handle your information as described in our Privacy Policy."],
        link: { path: "/privacy/", label: "Read the Privacy Policy" },
      },
      {
        title: "8. Changes to these terms",
        items: [
          "If these terms change, we'll post the update and its effective date on this page.",
          "If you keep using Rosterush after a change, you agree to the updated terms.",
        ],
      },
      {
        title: "9. Resolving disputes",
        items: [
          "These terms are governed by the laws of the Republic of Korea.",
          "If a dispute comes up, let's try to sort it out by email first. If that doesn't work, it will be settled in the courts of the Republic of Korea.",
        ],
      },
    ],
    contact: { title: "10. Operator and contact", person: "Operator", email: "Email" },
  },
};
