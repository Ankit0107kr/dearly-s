import Link from "next/link";
import { Motif } from "@/components/ui/Motif";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center gap-5 py-[14vh] text-center">
      <Motif name="gift" className="size-20 text-ink-faint" strokeWidth={1} />
      <h1 className="text-5xl font-semibold tracking-[-0.03em]">This gift went missing</h1>
      <p className="max-w-[46ch] text-base text-ink-soft text-pretty">
        The page you are after does not exist — it may have sold out or been renamed. The shop is
        still very much here.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="rounded-xs gradient-accent px-8 py-4 text-sm font-bold text-white shadow-soft"
        >
          Browse all gifts
        </Link>
        <Link href="/" className="rounded-xs border border-ink/15 px-8 py-4 text-sm font-bold">
          Back home
        </Link>
      </div>
    </div>
  );
}
