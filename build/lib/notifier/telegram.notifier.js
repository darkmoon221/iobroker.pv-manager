"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var telegram_notifier_exports = {};
__export(telegram_notifier_exports, {
  TelegramNotifier: () => TelegramNotifier
});
module.exports = __toCommonJS(telegram_notifier_exports);
var import_node_telegram_bot_api = __toESM(require("node-telegram-bot-api"));
class TelegramNotifier {
  constructor(adapter) {
    this.adapter = adapter;
    this.chatId = this.adapter.config.telegramChatId;
    this.bot = new import_node_telegram_bot_api.default(this.adapter.config.telegramBotToken, { polling: false });
  }
  async sendNotification(data) {
    this.bot.sendMessage(this.chatId, data).then(() => this.adapter.log.debug("Sent telegram message"));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TelegramNotifier
});
//# sourceMappingURL=telegram.notifier.js.map
