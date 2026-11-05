import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * 스티커처럼 그림자가 있고 누르면 그림자 쪽으로 눌리는 버튼.
 * 링크에 같은 모양을 입힐 때는 `buttonVariants()`를 className에 쓴다.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-black text-center font-black whitespace-nowrap transition-[translate,box-shadow] outline-none select-none focus-visible:ring-4 focus-visible:ring-sun/60 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        brand: "bg-brand text-white",
        sun: "bg-sun",
        white: "bg-white",
        danger: "bg-[#ff8fa3]",
      },
      size: {
        /** 화면 맨 아래 큰 행동 (다시 하기, 나도 도전하기, 공유 링크 만들기) */
        lg: "px-5 py-3 shadow-[3px_3px_0_#000]",
        /** 폼 제출, 링크 복사 */
        default: "px-5 py-2 text-sm shadow-[3px_3px_0_#000]",
        /** 댓글 수정·삭제 확인처럼 줄 안에 들어가는 작은 버튼 */
        sm: "rounded-lg px-2.5 py-1 text-xs shadow-sticker-sm",
      },
    },
    defaultVariants: {
      variant: "white",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
