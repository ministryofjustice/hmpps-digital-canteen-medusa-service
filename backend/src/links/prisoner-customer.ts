// src/links/prisoner-customer.ts
import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import PrisonerModule from "../modules/prisoner";

export default defineLink(
    CustomerModule.linkable.customer,
    PrisonerModule.linkable.prisoner
);