import { ListChecksIcon } from "lucide-react";
import { RiBillFill } from "react-icons/ri";
import { IoIosWallet } from "react-icons/io";
import { BsPeopleFill } from "react-icons/bs";
import { AiFillProduct } from "react-icons/ai";
import { IoShieldCheckmark } from "react-icons/io5";

import { IFeature } from "../types";

export const featuresData: IFeature[] = [
  {
    icon: <RiBillFill className="text-primary size-7" />,
    title: "Invoices",
    description:
      "Line items, per-product discounts, invoice-level discounts, credits, tax and adjustments; all in one document.",
  },
  {
    icon: <ListChecksIcon className="text-primary size-7" />,
    title: "Payment schedules",
    description:
      "Split an invoice into installments by amount or percentage, then record payments against each one.",
  },
  {
    icon: <IoIosWallet className="text-primary size-7" />,
    title: "Status tracking",
    description:
      "Draft, sent, partially paid, paid and overdue with this month's received and outstanding totals at a glance.",
  },
  {
    icon: <BsPeopleFill className="text-primary size-7" />,
    title: "Clients",
    description:
      "Individuals and organizations with contact details, addresses and a per-client invoice history.",
  },
  {
    icon: <AiFillProduct className="text-primary size-7" />,
    title: "Product catalogue",
    description:
      "Keep what you sell on hand in BDT and USD, at base and discounted prices, then add it to any invoice.",
  },
  {
    icon: <IoShieldCheckmark className="text-primary size-7" />,
    title: "Private by design",
    description:
      "Self-hosted, no telemetry and no third-party scripts. Cloud Invoice never advertises inside your invoices.",
  },
];
