import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  externalApi: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL,
  },
};
