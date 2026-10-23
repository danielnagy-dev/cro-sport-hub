import { Injectable } from "@nestjs/common";
import { packageId as sharedTypesPackageId } from "@cro-sport-hub/shared-types";
import { packageId as slideGeneratorPackageId } from "@cro-sport-hub/slide-generator";

export type HealthResponse = {
  status: "ok";
  sharedTypes: string;
  slideGenerator: string;
};

@Injectable()
export class AppService {
  getHealth(): HealthResponse {
    return {
      status: "ok",
      sharedTypes: sharedTypesPackageId,
      slideGenerator: slideGeneratorPackageId,
    };
  }
}
