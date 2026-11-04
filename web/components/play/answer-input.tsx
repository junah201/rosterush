"use client";

import { useRef } from "react";

type Props = {
  disabled: boolean;
  placeholder: string;
  /** 첫 입력(조합 시작 포함) 시 호출 — 타이머 시작용 */
  onFirstInput: () => void;
  /** 판정. 새로 맞혔으면 truthy */
  onAnswer: (text: string) => unknown;
};

/**
 * IME(한국어·일본어)를 고려한 정답 입력창.
 *
 * - 조합 중인 값도 판정한다. ("호두"의 "두"가 조합 중이어도 바로 정답 처리)
 * - 조합 중에 정답이면 입력창을 바로 비우지 않는다. 조합 중에 값을 지우면 브라우저가
 *   조합 중이던 글자를 다시 넣는 문제가 있어서, blur/focus로 조합을 끝낸 뒤 비운다.
 * - Enter: 틀린 입력을 한 번에 지운다.
 */
export function AnswerInput({ disabled, placeholder, onFirstInput, onAnswer }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const clearAfterComposition = useRef(false);

  const clear = () => {
    if (ref.current) ref.current.value = "";
  };

  const check = (el: HTMLInputElement) => {
    if (!el.value.trim() || !onAnswer(el.value)) return;
    if (!composing.current) return clear();
    clearAfterComposition.current = true;
    // 조합을 강제로 끝낸다 → compositionend에서 비움
    requestAnimationFrame(() => {
      el.blur();
      el.focus();
      if (clearAfterComposition.current) {
        clearAfterComposition.current = false;
        clear();
      }
    });
  };

  return (
    <input
      ref={ref}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      className="focus:ring-sun/60 h-12 w-full rounded-xl border-2 border-black bg-white px-3 text-lg font-bold outline-none placeholder:font-normal placeholder:text-[#9aa3b5] focus:ring-4 disabled:opacity-50"
      onCompositionStart={() => {
        composing.current = true;
        onFirstInput();
      }}
      onCompositionEnd={(e) => {
        composing.current = false;
        if (clearAfterComposition.current) {
          clearAfterComposition.current = false;
          clear();
        } else {
          check(e.currentTarget);
        }
      }}
      onInput={(e) => {
        onFirstInput();
        check(e.currentTarget);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) clear();
      }}
    />
  );
}
