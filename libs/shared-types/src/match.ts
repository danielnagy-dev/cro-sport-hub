import { z } from "zod";
import { idSchema, isoDateSchema, textSchema, timestampSchema } from "./common.ts";
import { matchSourceSchema, statusSchema } from "./enums.ts";

export const roundSchema = textSchema(40);

export const matchSchema = z
  .strictObject({
    id: idSchema,
    sportId: idSchema,
    competitionId: idSchema,
    date: isoDateSchema,
    round: roundSchema,
    status: statusSchema,
    source: matchSourceSchema,
    sourceRef: textSchema(200).optional(),
    createdBy: idSchema,
    reviewedBy: idSchema.optional(),
    publishedAt: timestampSchema.optional(),
  })
  .superRefine((match, ctx) => {
    if (
      match.status === "draft" &&
      (match.reviewedBy !== undefined || match.publishedAt !== undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "A draft match has no reviewer and no publish time",
      });
    }

    if (match.status === "review" && match.publishedAt !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "A match in review is not published yet",
      });
    }

    if (match.status === "published") {
      if (match.reviewedBy === undefined || match.publishedAt === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["status"],
          message: "A published match needs a reviewer and a publish time",
        });
      }
    }

    if (match.source === "import" && match.sourceRef === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceRef"],
        message: "An imported match needs a source ref",
      });
    }

    if (match.source === "manual" && match.sourceRef !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceRef"],
        message: "A manual match has no source ref",
      });
    }
  });

export type Match = z.infer<typeof matchSchema>;
