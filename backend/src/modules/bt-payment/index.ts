import BtPaymentProviderService from "./BtPaymentProviderService";
import {ModuleProvider} from "@medusajs/utils";
import {Modules} from "@medusajs/framework/utils";

export default ModuleProvider(Modules.PAYMENT, {
    services: [BtPaymentProviderService],
})