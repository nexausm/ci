import { ArrowUpRight } from "lucide-react";

import { involvedData } from "../data/involved";
import SectionTitle from "../SectionTitle";
import { IInvolvedCard } from "../types";

export default function CommunitySection() {
  return (
    <div id="community" className="w-full">
      <SectionTitle
        text2="Built in the open"
        text3="Cloud Invoice is an open-source project, not a product behind a paywall. Everything happens on GitHub."
      />

      <ul className="mt-16 grid gap-4 sm:grid-cols-2">
        {involvedData.map((card: IInvolvedCard) => (
          <li key={card.title} className="bg-card relative rounded-xl p-6">
            <a
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col text-teal-800 after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 dark:text-teal-300 dark:focus-visible:outline-teal-300"
            >
              {card.icon}

              <h3 className="mt-5 text-base font-medium">{card.title}</h3>
              <p className="text-muted-foreground mt-2 text-pretty">
                {card.description}
              </p>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 dark:text-teal-300">
                {card.cta}
                <ArrowUpRight className="size-4" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
