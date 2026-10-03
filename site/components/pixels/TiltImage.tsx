import Image from "next/image";

export default function TiltedImage() {
  return (
    <figure className="relative mt-16 w-full">
      <Image
        src="/assets/hero-section-showcase.png"
        className="h-auto w-full rounded-[15px]"
        alt="Placeholder screenshot — replace with a real Cloud Invoice dashboard capture"
        width={1332}
        height={620}
        priority
      />
    </figure>
  );
}
