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
var metricsCalculator_exports = {};
__export(metricsCalculator_exports, {
  MetricsCalculator: () => MetricsCalculator
});
module.exports = __toCommonJS(metricsCalculator_exports);
var import_model = require("./model");
class MetricsCalculator {
  constructor(pvManager) {
    this.wechselRichterTotal = "";
    this.wechselRichterCurrent = "";
    this.meterData = "";
    this.adapter = pvManager;
  }
  updateWechselrichterTotal(total) {
    if (total) {
      this.wechselRichterTotal = total;
      this.adapter.log.debug("Update WechselrichterTotal: " + this.wechselRichterTotal);
    }
  }
  updateEnergyMeterData(meterData) {
    if (meterData) {
      this.meterData = meterData;
      this.calculateMetrics();
      this.calculateLiveConsumption();
    }
  }
  updateWechselrichterCurrent(current) {
    if (current) {
      this.wechselRichterCurrent = current;
    }
  }
  getSensorData() {
    return JSON.parse(this.meterData, (_, val) => {
      if (Array.isArray(val) || typeof val !== "object") {
        return val;
      }
      return Object.entries(val).reduce((a, [key, val2]) => {
        a[key.toLowerCase()] = val2;
        return a;
      }, {});
    });
  }
  calculateMetrics() {
    if (this.wechselRichterTotal) {
      const sensorData = this.getSensorData();
      const wrKWH = parseFloat(this.wechselRichterTotal) / 1e3;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.wechselrichter, wrKWH);
      const bezugHaushalt = sensorData.strom.bezug;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugHaushalt, bezugHaushalt);
      const einspeisungHaushalt = sensorData.strom.einspeisung;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.einspeisungHaushalt, einspeisungHaushalt);
      const wpBezug = sensorData.heizung["1.8.0"];
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugWp, wpBezug);
      const wpEinspeisung = sensorData.heizung["2.8.0"];
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.einspeisungWp, wpEinspeisung);
      const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);
      const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfWp, eigenbedarfWp);
      const bezugNetzWp = this.adapter.config.wpEnergyMeterTotalConsumptionBeforeChange + wpBezug - bezugHaushalt;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugNetz, bezugNetzWp);
      const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);
      const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);
      const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);
      const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);
      const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);
    }
  }
  calculateLiveConsumption() {
    if (this.wechselRichterCurrent) {
      const sensorData = this.getSensorData();
      const wrEinspeisung = parseFloat(this.wechselRichterCurrent);
      this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.wechselrichterEinspeisung, wrEinspeisung);
      const bezugHaushaltRaw = sensorData.strom.aktleist;
      const bezugWpRaw = sensorData.heizung.aktleist;
      if (bezugHaushaltRaw < 0) {
        const verbrauchHaushalt = wrEinspeisung - Math.abs(bezugHaushaltRaw);
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchHaushalt, verbrauchHaushalt);
        if (bezugWpRaw < 0) {
          const verbrauchWp = Math.abs(bezugHaushaltRaw) - Math.abs(bezugWpRaw);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, Math.abs(bezugWpRaw));
        } else {
          const verbrauchWp = Math.abs(bezugHaushaltRaw) + bezugWpRaw;
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
          const einspeisung = 0;
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, einspeisung);
          const bezugNetz = bezugWpRaw;
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.bezugNetz, bezugNetz);
        }
      } else {
        const verbrauchHaushalt = wrEinspeisung + bezugHaushaltRaw;
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchHaushalt, verbrauchHaushalt);
        const verbrauchWp = bezugWpRaw - bezugHaushaltRaw;
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
        const einspeisung = 0;
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, einspeisung);
        const bezugNetz = bezugWpRaw;
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.bezugNetz, bezugNetz);
      }
    }
  }
  async intitializeStates() {
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.wechselrichter, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.bezugHaushalt, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.einspeisungHaushalt, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.bezugWp, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.einspeisungWp, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.eigenbedarfHaushalt, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.eigenbedarfWp, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.bezugNetz, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.gesamtVerbrauchHaushalt, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.gesamtVerbrauchWp, "kWh");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.anteilEigenbedarfHaushalt, "%");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.anteilEigenbedarfWp, "%");
    await this.createObject(import_model.STATES.total.prefix, import_model.STATES.total.gesamtEigenverbrauch, "%");
    await this.createObject(import_model.STATES.current.prefix, import_model.STATES.current.wechselrichterEinspeisung, "W");
    await this.createObject(import_model.STATES.current.prefix, import_model.STATES.current.verbrauchHaushalt, "W");
    await this.createObject(import_model.STATES.current.prefix, import_model.STATES.current.verbrauchWp, "W");
    await this.createObject(import_model.STATES.current.prefix, import_model.STATES.current.einspeisungUeberschuss, "W");
    await this.createObject(import_model.STATES.current.prefix, import_model.STATES.current.bezugNetz, "W");
  }
  createObject(prefix, state, unit) {
    return this.adapter.setObjectNotExistsAsync(prefix + state, {
      type: "state",
      common: {
        name: state,
        type: "number",
        role: "variable",
        read: true,
        write: true,
        unit
      },
      native: {}
    });
  }
  setStateWithAck(state, value) {
    this.adapter.setStateAsync(state, { val: value, ack: true });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MetricsCalculator
});
//# sourceMappingURL=metricsCalculator.js.map