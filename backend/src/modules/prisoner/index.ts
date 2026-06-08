import PrisonerModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const PRISONER_MODULE = "prisoner";

export default Module(PRISONER_MODULE, {
    service: PrisonerModuleService,
});