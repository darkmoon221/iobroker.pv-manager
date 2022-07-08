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
var import_metricsCalculator = require("./lib/metricsCalculator");
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
    this.log.info("config option1: " + this.config.option1);
    this.log.info("config option2: " + this.config.option2);
    this.log.info("Energy meter datapoint: " + this.config.energyMeterDatapoint);
    this.metricsCalculator = new import_metricsCalculator.MetricsCalculator(this);
    await this.metricsCalculator.intitializeStates();
    this.subscribeForeignStates(this.config.option1);
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
    if (id === this.config.option1) {
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
