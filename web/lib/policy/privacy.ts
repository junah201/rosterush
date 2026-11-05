import type { Lang } from "@rosterush/core";
import type { PolicyDoc, Ymd } from "./common";

/**
 * 개인정보 처리방침 본문.
 * 실제 저장 동작(api/src/results.ts, shares.ts, comments.ts, lib/ratelimit.ts, web/lib/records.ts·nickname.ts)과
 * 맞춰 쓴다. 보관 기간이나 저장 항목을 바꾸면 여기도 고치고 EFFECTIVE를 올릴 것.
 */

const EFFECTIVE: Ymd = { y: 2026, m: 11, d: 6 };

/** 저장하는 정보 한 종류 */
export type PrivacyData = {
  name: string;
  /** 저장 내용 */
  what: string;
  /** 이유 */
  why: string;
  /** 보관 기간 */
  keep: string;
};

/** 개인정보 처리방침은 공통 구성에 '저장하는 정보' 카드가 더 있다 */
export type PrivacyDoc = PolicyDoc & {
  dataTitle: string;
  /** 처음 나오는 용어 풀이 */
  dataNote: string;
  dataLabels: { what: string; why: string; keep: string };
  data: PrivacyData[];
};

export const privacy: Record<Lang, PrivacyDoc> = {
  ko: {
    title: "개인정보 처리방침",
    description: "Rosterush가 어떤 정보를 왜 저장하고, 얼마나 보관하는지 알려 드려요.",
    effective: EFFECTIVE,
    intro:
      "Rosterush는 회원가입 없이 즐기는 퀴즈예요. 서비스를 운영하는 데 꼭 필요한 정보만 저장해요.",
    summaryTitle: "한눈에 보기",
    summary: [
      "회원가입이 없고, 이름·이메일·전화번호를 받지 않아요.",
      "IP 주소와 비밀번호는 원래 값 그대로 저장하지 않아요.",
      "플레이 기록은 30일 뒤 자동으로 지워져요.",
    ],
    notice:
      "공유 기록과 댓글(닉네임 포함)은 누구나 볼 수 있어요. 실명이나 연락처 같은 개인정보는 적지 마세요.",
    dataTitle: "1. 저장하는 정보",
    dataNote: "해시: 원래 값으로 되돌릴 수 없게 바꾼 값이에요.",
    dataLabels: { what: "저장 내용", why: "이유", keep: "보관 기간" },
    data: [
      {
        name: "플레이 기록",
        what: "게임, 언어, 난이도, 맞힌 캐릭터, 걸린 시간, 끝난 이유",
        why: "상위 % 같은 통계를 내고, 기록을 공유·첨부할 수 있게 하려고",
        keep: "30일 뒤 자동으로 지워져요. 합산한 통계는 남지만 누구의 기록인지는 알 수 없어요.",
      },
      {
        name: "공유 기록",
        what: "공유 링크를 만들 때의 기록 요약, 닉네임(선택)",
        why: "공유 페이지를 보여주려고",
        keep: "기한 없이 남아요. 지우고 싶으면 아래 이메일로 알려 주세요.",
      },
      {
        name: "댓글",
        what: "닉네임, 내용, 첨부한 기록, 작성·수정 시각, 비밀번호(해시)",
        why: "댓글을 보여주고, 수정·삭제할 때 본인인지 확인하려고",
        keep: "직접 삭제할 때까지 남아요. 답글이 달린 댓글은 닉네임과 내용만 지우고 '삭제된 댓글' 자리를 남겨요.",
      },
      {
        name: "IP 해시",
        what: "IP 주소를 비밀키로 바꾼 값. IP 주소 자체는 저장하지 않아요.",
        why: "도배, 조작된 기록, 비밀번호 무작위 대입을 막으려고",
        keep: "함께 저장된 플레이 기록·댓글과 같아요.",
      },
      {
        name: "요청 횟수",
        what: "IP 해시별로 짧은 시간 동안 보낸 요청 수",
        why: "한꺼번에 너무 많은 요청이 오는 걸 막으려고",
        keep: "1시간 남짓 뒤 자동으로 지워져요.",
      },
      {
        name: "서버 오류 로그",
        what: "오류가 났을 때의 요청 정보",
        why: "장애를 찾아 고치려고",
        keep: "14일 뒤 자동으로 지워져요.",
      },
    ],
    sections: [
      {
        title: "2. 브라우저에 저장하는 정보",
        items: [
          "최근 플레이 기록(최대 50개)과 마지막으로 쓴 닉네임을 이 브라우저 안의 저장 공간(localStorage)에 저장해요.",
          "기록을 공유·첨부할 때 내 기록인지 확인하고, 닉네임을 다시 입력하지 않게 하려는 거예요. 서버로 따로 보내지 않아요.",
          "브라우저에서 이 사이트의 데이터를 지우면 함께 사라져요.",
          "광고나 방문 분석을 위한 쿠키·추적 도구는 쓰지 않아요.",
        ],
      },
      {
        title: "3. 다른 곳에 제공하거나 맡기는 경우",
        items: [
          "저장한 정보를 팔거나 다른 곳에 넘기지 않아요.",
          "비밀번호 해시와 IP 해시는 어디에도 공개하지 않아요.",
          "서버와 데이터 저장은 Amazon Web Services(AWS)에 맡기고 있어요. 데이터는 서울에 있는 서버에 저장돼요.",
          "페이지를 빠르게 보내려고 AWS CloudFront가 전 세계에 둔 서버를 거쳐 전달할 수 있어요.",
        ],
      },
      {
        title: "4. 이용자의 권리",
        items: [
          "댓글은 작성할 때 정한 비밀번호로 언제든 직접 수정·삭제할 수 있어요.",
          "비밀번호를 잊었거나, 공유 기록 같은 다른 정보를 보거나 지우고 싶다면 아래 이메일로 알려 주세요.",
          "회원 정보가 없어서 공유 링크나 댓글이 달린 게임·언어를 함께 보내 주셔야 빨리 찾을 수 있어요.",
          "요청을 확인하면 처리하고, 결과를 답장으로 알려 드려요.",
        ],
      },
      {
        title: "5. 안전하게 지키는 방법",
        items: [
          "모든 통신은 HTTPS로 암호화해요.",
          "비밀번호와 IP 주소는 해시로만 저장해요.",
          "데이터베이스에는 서비스 서버만 접근할 수 있어요.",
        ],
      },
      {
        title: "6. 방침이 바뀔 때",
        items: ["방침을 바꾸면 이 페이지에 바뀐 내용과 적용 날짜를 올려요."],
      },
    ],
    contact: {
      title: "7. 개인정보 보호책임자와 문의처",
      person: "개인정보 보호책임자",
      email: "이메일",
    },
  },
  ja: {
    title: "プライバシーポリシー",
    description: "Rosterushがどんな情報を、なぜ、どのくらいの期間保存するかをご案内します。",
    effective: EFFECTIVE,
    intro:
      "Rosterushは会員登録なしで遊べるクイズです。サービスの運営に必要な情報だけを保存します。",
    summaryTitle: "ひと目でわかるポイント",
    summary: [
      "会員登録はなく、名前・メールアドレス・電話番号は受け取りません。",
      "IPアドレスとパスワードは元の値のままでは保存しません。",
      "プレイ記録は30日後に自動で削除されます。",
    ],
    notice:
      "シェア記録とコメント（ニックネームを含む）は誰でも見られます。本名や連絡先などの個人情報は書かないでください。",
    dataTitle: "1. 保存する情報",
    dataNote: "ハッシュ：元の値に戻せないように変換した値のことです。",
    dataLabels: { what: "保存する内容", why: "目的", keep: "保存期間" },
    data: [
      {
        name: "プレイ記録",
        what: "ゲーム、言語、難易度、正解したキャラ、かかった時間、終了理由",
        why: "上位%などの統計を出し、記録をシェア・添付できるようにするため",
        keep: "30日後に自動で削除されます。集計した統計は残りますが、誰の記録かはわかりません。",
      },
      {
        name: "シェア記録",
        what: "シェアリンク作成時の記録の要約、ニックネーム（任意）",
        why: "シェアページを表示するため",
        keep: "期限なく保存します。削除したい場合は下記のメールでお知らせください。",
      },
      {
        name: "コメント",
        what: "ニックネーム、本文、添付した記録、投稿・編集日時、パスワード（ハッシュ）",
        why: "コメントを表示し、編集・削除のときに本人か確認するため",
        keep: "本人が削除するまで保存します。返信のあるコメントは、ニックネームと本文だけを消して「削除されたコメント」の枠を残します。",
      },
      {
        name: "IPハッシュ",
        what: "IPアドレスを秘密鍵で変換した値。IPアドレスそのものは保存しません。",
        why: "連投、不正な記録、パスワードの総当たりを防ぐため",
        keep: "一緒に保存したプレイ記録・コメントと同じです。",
      },
      {
        name: "リクエスト回数",
        what: "IPハッシュごとの短時間のリクエスト数",
        why: "一度に大量のリクエストが来るのを防ぐため",
        keep: "1時間ほどで自動的に削除されます。",
      },
      {
        name: "サーバーのエラーログ",
        what: "エラーが起きたときのリクエスト情報",
        why: "障害を見つけて直すため",
        keep: "14日後に自動で削除されます。",
      },
    ],
    sections: [
      {
        title: "2. ブラウザに保存する情報",
        items: [
          "最近のプレイ記録（最大50件）と最後に使ったニックネームを、このブラウザ内の保存領域（localStorage）に保存します。",
          "記録のシェアや添付のときに自分の記録か確認し、ニックネームを再入力しなくて済むようにするためです。サーバーへ別途送ることはありません。",
          "ブラウザでこのサイトのデータを消すと一緒に消えます。",
          "広告やアクセス解析のためのCookie・トラッキングツールは使っていません。",
        ],
      },
      {
        title: "3. 第三者への提供と委託",
        items: [
          "保存した情報を販売したり、他者に渡したりしません。",
          "パスワードのハッシュとIPハッシュはどこにも公開しません。",
          "サーバーとデータの保存はAmazon Web Services（AWS）に委託しています。データはソウルにあるサーバーに保存されます。",
          "ページを速く届けるため、AWS CloudFrontが世界各地に置いたサーバーを経由することがあります。",
        ],
      },
      {
        title: "4. 利用者の権利",
        items: [
          "コメントは投稿時に決めたパスワードで、いつでも編集・削除できます。",
          "パスワードを忘れた場合や、シェア記録などその他の情報の確認・削除を希望する場合は、下記のメールでお知らせください。",
          "会員情報がないため、シェアリンクやコメントのあるゲーム・言語を添えていただくとすぐに見つけられます。",
          "ご依頼を確認したら対応し、結果をメールでお知らせします。",
        ],
      },
      {
        title: "5. 安全のための措置",
        items: [
          "すべての通信をHTTPSで暗号化しています。",
          "パスワードとIPアドレスはハッシュでのみ保存します。",
          "データベースにはサービスのサーバーだけがアクセスできます。",
        ],
      },
      {
        title: "6. ポリシーの変更",
        items: ["このポリシーを変更する場合は、変更内容と施行日をこのページに掲載します。"],
      },
    ],
    contact: {
      title: "7. 個人情報保護責任者とお問い合わせ先",
      person: "個人情報保護責任者",
      email: "メール",
    },
  },
  en: {
    title: "Privacy Policy",
    description: "What Rosterush stores, why, and for how long.",
    effective: EFFECTIVE,
    intro:
      "Rosterush is a quiz you can play without an account. We only store what we need to run it.",
    summaryTitle: "At a glance",
    summary: [
      "There are no accounts, and we never ask for your name, email or phone number.",
      "We never store your IP address or password in their original form.",
      "Game runs are deleted automatically after 30 days.",
    ],
    notice:
      "Shared runs and comments (including nicknames) are visible to everyone. Don't include your real name, contact details or other personal information.",
    dataTitle: "1. What we store",
    dataNote: "Hash: a value transformed so it can't be turned back into the original.",
    dataLabels: { what: "What", why: "Why", keep: "How long" },
    data: [
      {
        name: "Game runs (your play records)",
        what: "Game, language, difficulty, the characters you named, your time, and how the run ended",
        why: "To compute stats like your percentile, and to let you share or attach a run",
        keep: "Deleted automatically after 30 days. Combined stats remain, but they can't be traced back to anyone.",
      },
      {
        name: "Shared runs",
        what: "A summary of the run when you created the link, plus a nickname if you entered one",
        why: "To show the share page",
        keep: "Kept with no expiry. Email us below to have one removed.",
      },
      {
        name: "Comments",
        what: "Nickname, text, attached run, post and edit times, and your password (hashed)",
        why: "To show comments and confirm it's you when you edit or delete",
        keep: 'Kept until you delete them. If a comment has replies, we erase its nickname and text and leave a "deleted comment" placeholder.',
      },
      {
        name: "IP hash",
        what: "Your IP address transformed with a secret key. We never store the IP address itself.",
        why: "To stop spam, fake runs and password guessing",
        keep: "Same as the run or comment it was saved with.",
      },
      {
        name: "Request counts",
        what: "How many requests each IP hash sent in a short time",
        why: "To block floods of requests",
        keep: "Deleted automatically within about an hour.",
      },
      {
        name: "Server error logs",
        what: "Request details when something goes wrong",
        why: "To find and fix problems",
        keep: "Deleted automatically after 14 days.",
      },
    ],
    sections: [
      {
        title: "2. What's stored in your browser",
        items: [
          "Your recent game runs (up to 50) and the last nickname you used are saved in this browser's own storage (localStorage).",
          "This lets us confirm a run is yours when you share or attach it, and saves you retyping your nickname. It isn't sent to our servers separately.",
          "Clearing this site's data in your browser removes it.",
          "We don't use cookies or trackers for ads or analytics.",
        ],
      },
      {
        title: "3. Sharing and service providers",
        items: [
          "We don't sell or hand over what we store.",
          "Password hashes and IP hashes are never made public.",
          "Hosting and storage are provided by Amazon Web Services (AWS). Your data is stored on servers in Seoul.",
          "To load pages faster, they may be delivered through AWS CloudFront servers around the world.",
        ],
      },
      {
        title: "4. Your rights",
        items: [
          "You can edit or delete your comments any time with the password you set.",
          "If you forgot your password, or want to see or remove anything else such as a shared run, email us below.",
          "Since there are no accounts, include the share link, or the game and language where you commented, so we can find it quickly.",
          "Once we've confirmed your request, we'll take care of it and reply with the result.",
        ],
      },
      {
        title: "5. How we protect it",
        items: [
          "All traffic is encrypted with HTTPS.",
          "Passwords and IP addresses are stored only as hashes.",
          "Only the service's own servers can access the database.",
        ],
      },
      {
        title: "6. Changes to this policy",
        items: [
          "If this policy changes, we'll post the update and its effective date on this page.",
        ],
      },
    ],
    contact: {
      title: "7. Privacy officer and contact",
      person: "Privacy officer",
      email: "Email",
    },
  },
};
