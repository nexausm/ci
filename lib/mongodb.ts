import mongoose from "mongoose";

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI environment variable is not set");
}
const dbUri: string = uri;

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(dbUri);
  }
  return global._mongoosePromise;
}

export async function getDb() {
  return (await connectDb()).connection;
}
