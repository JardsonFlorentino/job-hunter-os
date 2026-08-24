import "dotenv/config";

import { parseRuntimeConfig } from "./environment.js";

export const runtimeConfig = parseRuntimeConfig(process.env);
