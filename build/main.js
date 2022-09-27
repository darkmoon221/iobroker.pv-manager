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
var main_exports = {};
__export(main_exports, {
  PvManager: () => PvManager
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var import_cronJobs = require("./lib/cronJobs");
var import_metricsCalculator = require("./lib/metricsCalculator");
var import_telegram = require("./lib/notifier/telegram.notifier");
class PvManager extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "pv-manager"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    this.setState("info.connection", false, true);
    this.log.debug("Wechselrichter total feed data point: " + this.config.wechselrichterTotalDataPoint);
    this.log.debug("Total consumption of wp energy meter before change: " + this.config.wpEnergyMeterTotalConsumptionBeforeChange);
    this.log.debug("Energy meter datapoint: " + this.config.energyMeterDatapoint);
    this.log.debug("Wechselrichter current feed data point: " + this.config.wechselrichterCurrentDataPoint);
    this.log.debug("Wechselrichter correction value for total value: " + this.config.wechselrichterTotalKorrekturWert);
    this.metricsCalculator = new import_metricsCalculator.MetricsCalculator(this);
    await this.metricsCalculator.initializeStates();
    const telegramNotifier = new import_telegram.TelegramNotifier(this);
    const cronJobs = new import_cronJobs.CronJobs(this, telegramNotifier);
    await cronJobs.createDailyAtMidnight();
    this.subscribeForeignStates(this.config.wechselrichterTotalDataPoint);
    this.subscribeForeignStates(this.config.energyMeterDatapoint);
    this.subscribeForeignStates(this.config.wechselrichterCurrentDataPoint);
    this.setState("info.connection", true, true);
  }
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    var _a, _b, _c, _d, _e, _f;
    if (id === this.config.wechselrichterTotalDataPoint) {
      (_b = this.metricsCalculator) == null ? void 0 : _b.updateWechselrichterTotal((_a = state == null ? void 0 : state.val) == null ? void 0 : _a.toString());
    }
    if (id === this.config.energyMeterDatapoint) {
      (_d = this.metricsCalculator) == null ? void 0 : _d.updateEnergyMeterData((_c = state == null ? void 0 : state.val) == null ? void 0 : _c.toString());
    }
    if (id === this.config.wechselrichterCurrentDataPoint) {
      (_f = this.metricsCalculator) == null ? void 0 : _f.updateWechselrichterCurrent((_e = state == null ? void 0 : state.val) == null ? void 0 : _e.toString());
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new PvManager(options);
} else {
  (() => new PvManager())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PvManager
});
//# sourceMappingURL=main.js.map
