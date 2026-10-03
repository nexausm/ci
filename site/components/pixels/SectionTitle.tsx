import { SectionTitleProps } from "./types";

export default function SectionTitle({ text2, text3 }: SectionTitleProps) {
  return (
    <>
      <p className="bg-muted text-primary mx-auto mt-28 w-max max-w-full rounded-full px-6 py-2 text-center text-sm font-medium wrap-break-word sm:px-10"></p>
      <h3 className="text-foreground mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold text-balance">
        {text2}
      </h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-center text-pretty">
        {text3}
      </p>
    </>
  );
}
