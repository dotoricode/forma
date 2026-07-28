import { z } from "zod";
import { FormaSpecSchema } from "./schema.js";

export const FORMA_SCHEMA_ID = "https://forma.tools/schema/forma.schema.json";

export function buildFormaJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(FormaSpecSchema) as Record<string, unknown>;
  return { $id: FORMA_SCHEMA_ID, title: "FormaSpec", ...schema };
}
