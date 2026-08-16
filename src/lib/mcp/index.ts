import { defineMcp } from "@lovable.dev/mcp-js";
import listServicesTool from "./tools/list-services";
import getServiceTool from "./tools/get-service";
import sendInquiryTool from "./tools/send-inquiry";


export default defineMcp({
  name: "pixel-perfect-capture",
  title: "Pixel Perfect Capture",
  version: "0.1.0",
  instructions:
    "Tools for theroyeffect.com, the studio site of designer and no-code developer Rory Ulloa. Use `list_services` and `get_service` to answer questions about services, pricing tiers and add-ons, and `send_inquiry` to send Rory a new project inquiry on the user's behalf.",
  tools: [listServicesTool, getServiceTool, sendInquiryTool] as never,
});
