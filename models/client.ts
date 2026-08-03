export type ClientType = "individual" | "organization";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  addressLines: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDoc extends Client {
  _id: string;
}
