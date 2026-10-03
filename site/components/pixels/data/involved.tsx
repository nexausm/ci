import {
  RiBugFill,
  RiFileTextFill,
  RiGitPullRequestFill,
} from "react-icons/ri";
import { TbMessagesFilled } from "react-icons/tb";

import { GITHUB_REPO_URL } from "@site/lib/site";

import { IInvolvedCard } from "../types";

export const involvedData: IInvolvedCard[] = [
  {
    icon: (
      <TbMessagesFilled className="size-6 text-teal-800" />
    ),
    title: "Discussions",
    description:
      "Ask a question, compare setups, or work through a workflow with other people running their own instance.",
    cta: "Start a discussion",
    href: `${GITHUB_REPO_URL}/discussions`,
  },
  {
    icon: <RiBugFill className="size-6 text-teal-800" />,
    title: "Bug reports",
    description:
      "Found something broken? Search the tracker first, then open an issue with a clear reproduction.",
    cta: "Report a bug",
    href: `${GITHUB_REPO_URL}/issues`,
  },
  {
    icon: (
      <RiGitPullRequestFill className="size-6 text-teal-800" />
    ),
    title: "Contributions",
    description:
      "The whole codebase is open. Pick an issue, fork the repository and open a pull request.",
    cta: "Open a pull request",
    href: `${GITHUB_REPO_URL}/pulls`,
  },
  {
    icon: (
      <RiFileTextFill className="size-6 text-teal-800" />
    ),
    title: "Release notes",
    description:
      "Every tagged release lists exactly what changed, so you can see what you are upgrading to.",
    cta: "Browse releases",
    href: `${GITHUB_REPO_URL}/releases`,
  },
];
