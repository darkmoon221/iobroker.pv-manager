"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cronJobs_exports = {};
__export(cronJobs_exports, {
  CronJobs: () => CronJobs
});
module.exports = __toCommonJS(cronJobs_exports);
var import_cron = require("cron");
var import_stateUtils = require("./stateUtils");
class CronJobs {
  constructor(pvManager, notifier) {
    this.cronExpression = "0 0 * * *";
    this.timezone = "Europe/Berlin";
    this.historyPrefix = "history.";
    this.adapter = pvManager;
    this.notifier = notifier;
  }
  async createDailyAtMidnight() {
    this.adapter.log.debug("Create daily cron job at midnight: " + this.cronExpression);
    new import_cron.CronJob(this.cronExpression, () => this.createStatisticsForLastDay(), () => this.adapter.log.debug("cron job stopped"), true, this.timezone);
  }
  createStatisticsForLastDay() {
    this.initializeYesterday().then((state) => {
      this.adapter.log.debug("Created state: " + state);
      this.adapter.getStateAsync("cumulated").then((data) => {
        this.adapter.log.debug("Copy state: " + data);
        if (data && data.val) {
          const value = data == null ? void 0 : data.val;
          this.adapter.log.debug("Set state: " + value);
          import_stateUtils.StateUtils.setStateWithAck(this.adapter, state, value.toString()).then(() => {
            if (this.adapter.config.sendNotifications) {
              this.notifier.sendNotification(value.toString()).then();
            }
          });
        }
      });
    });
  }
  async initializeYesterday() {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));
    const state = this.historyPrefix + yesterday.getFullYear() + "." + (yesterday.getMonth() + 1) + "." + yesterday.getDate();
    await this.adapter.setObjectNotExistsAsync(state, {
      type: "state",
      common: {
        name: state,
        type: "object",
        role: "variable",
        read: true,
        write: true
      },
      native: {}
    });
    return Promise.resolve(state);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CronJobs
});
//# sourceMappingURL=cronJobs.js.map
