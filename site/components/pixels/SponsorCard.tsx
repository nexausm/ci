import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { ISponsor } from "./types";

export default function SponsorCard({ sponsor }: { sponsor: ISponsor }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card group flex h-full flex-col rounded-xl p-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300"
    >
      <Image
        src={sponsor.logo}
        alt={sponsor.name}
        width={1327}
        height={512}
        className="h-16 w-auto self-start rounded-md"
      />
      <p className="text-muted-foreground mt-5 text-pretty">
        {sponsor.description}
      </p>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 group-hover:underline dark:text-teal-300">
        Visit {sponsor.name}
        <ArrowUpRight className="size-4" />
      </span>
    </a>
  );
}
