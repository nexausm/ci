import Link from "next/link";

import { sponsorsData } from "../data/sponsors";
import SectionTitle from "../SectionTitle";
import SponsorCard from "../SponsorCard";

export default function SponsorsSection() {
  return (
    <div id="sponsors" className="w-full">
      <SectionTitle
        text2="Backed by our sponsors"
        text3="These companies help keep Cloud Invoice free and open source."
      />

      <ul className="mx-auto mt-16 grid max-w-xl gap-4">
        {sponsorsData.map((sponsor) => (
          <li key={sponsor.name}>
            <SponsorCard sponsor={sponsor} />
          </li>
        ))}
      </ul>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/sponsors"
          className="text-primary font-medium hover:underline"
        >
          Become a sponsor →
        </Link>
      </p>
    </div>
  );
}
