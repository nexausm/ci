import type { ReactNode } from "react";

export interface SectionTitleProps {
  text2: string;
  text3: string;
}

export interface IFeature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface IFooter {
  title: string;
  links: IFooterLink[];
}

export interface IFooterLink {
  name: string;
  href: string;
  external?: boolean;
}

export interface NavbarProps {
  navlinks: INavLink[];
}

export interface INavLink {
  name: string;
  href: string;
  external?: boolean;
}

export interface IInvolvedCard {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}
