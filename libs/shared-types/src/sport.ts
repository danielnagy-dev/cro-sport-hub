import { z } from "zod";
import { idSchema, textSchema } from "./common.ts";
import { sportSlugSchema } from "./enums.ts";

export const sportSchema = z.strictObject({
  id: idSchema,
  slug: sportSlugSchema,
  name: textSchema(40),
});

export type Sport = z.infer<typeof sportSchema>;
