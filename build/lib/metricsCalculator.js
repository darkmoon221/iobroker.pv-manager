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
      this.adapter.log.warn("Before calcMetrtics");
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
    this.adapter.log.warn("In calcMetrtics");
    if (this.wechselRichterTotal) {
      const sensorData = this.getSensorData();
      this.adapter.log.debug("Sensordata: " + JSON.stringify(sensorData));
      const wrKWH = parseFloat(this.wechselRichterTotal) / 1e3;
      this.adapter.log.debug("Wechselrichter in kWh: " + wrKWH);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.wechselrichter, wrKWH);
      const bezugHaushalt = sensorData.strom.bezug;
      this.adapter.log.debug("Bezug Haushalt in kWh: " + bezugHaushalt);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugHaushalt, bezugHaushalt);
      const einspeisungHaushalt = sensorData.strom.einspeisung;
      this.adapter.log.debug("Einspeisung Haushalt in kWh: " + einspeisungHaushalt);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.einspeisungHaushalt, einspeisungHaushalt);
      const wpBezug = sensorData.heizung["1.8.0"];
      this.adapter.log.debug("Bezug WP in kWh: " + wpBezug);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugWp, wpBezug);
      const wpEinspeisung = sensorData.heizung["2.8.0"];
      this.adapter.log.debug("Einspeisung WP in kWh: " + wpEinspeisung);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.einspeisungWp, wpEinspeisung);
      const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
      this.adapter.log.debug("Eigenbedarf Haushalt: " + eigenbedarfHaushalt);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);
      const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
      this.adapter.log.debug("Eigenbedarf WP: " + eigenbedarfWp);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfWp, eigenbedarfWp);
      const bezugNetzWp = this.adapter.config.option2 + wpBezug - bezugHaushalt;
      this.adapter.log.debug("Bezug Netz WP: " + bezugNetzWp);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.bezugNetz, bezugNetzWp);
      const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
      this.adapter.log.debug("Gesamtverbrauch Haushalt: " + gesamtVerbrauchHaushalt);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);
      const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
      this.adapter.log.debug("Gesamtverbrauch WP: " + gesamtVerbrauchWP);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);
      const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
      this.adapter.log.debug("Eigenbedarf Haushalt %: " + eigenbedarfHaushaltAnteil);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);
      const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
      this.adapter.log.debug("Eigenbedarf WP %: " + eigenbedarfWpAnteil);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);
      const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
      this.adapter.log.debug("Eigenbedarf gesamt %: " + eigenbedarfGesamtAnteil);
      this.setStateWithAck(import_model.STATES.total.prefix + import_model.STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);
    }
  }
  calculateLiveConsumption() {
    if (this.wechselRichterCurrent) {
      const sensorData = this.getSensorData();
      this.adapter.log.debug("Update energy meter data: " + JSON.stringify(sensorData));
      const wrEinspeisung = parseFloat(this.wechselRichterCurrent);
      this.adapter.log.debug("WR Einspeisung: " + wrEinspeisung);
      this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.wechselrichterEinspeisung, wrEinspeisung);
      const bezugHaushaltRaw = sensorData.strom.aktleist;
      const bezugWpRaw = sensorData.heizung.aktleist;
      this.adapter.log.debug("Haushalt Bezug (raw): " + bezugHaushaltRaw);
      this.adapter.log.debug("WR Bezug (raw): " + bezugWpRaw);
      if (bezugHaushaltRaw < 0) {
        const verbrauchHaushalt = wrEinspeisung - Math.abs(bezugHaushaltRaw);
        this.adapter.log.debug("Verbrauch Haushalt: " + verbrauchHaushalt);
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchHaushalt, verbrauchHaushalt);
        if (bezugWpRaw < 0) {
          const verbrauchWp = Math.abs(bezugHaushaltRaw) - Math.abs(bezugWpRaw);
          this.adapter.log.debug("Verbrauch WP: " + verbrauchWp);
          this.adapter.log.debug("Einspeisung \xDCberschuss: " + Math.abs(bezugWpRaw));
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, Math.abs(bezugWpRaw));
        } else {
          const verbrauchWp = Math.abs(bezugHaushaltRaw) + bezugWpRaw;
          this.adapter.log.debug("Verbrauch WP: " + verbrauchWp);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
          const einspeisung = 0;
          this.adapter.log.debug("Einspeisung \xDCberschuss: " + einspeisung);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, einspeisung);
          const bezugNetz = bezugWpRaw;
          this.adapter.log.debug("Bezug Netz: " + bezugNetz);
          this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.bezugNetz, bezugNetz);
        }
      } else {
        const verbrauchHaushalt = wrEinspeisung + bezugHaushaltRaw;
        this.adapter.log.debug("Verbrauch Haushalt: " + verbrauchHaushalt);
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchHaushalt, verbrauchHaushalt);
        const verbrauchWp = bezugWpRaw - bezugHaushaltRaw;
        this.adapter.log.debug("Verbrauch WP: " + verbrauchWp);
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, verbrauchWp);
        const einspeisung = 0;
        this.adapter.log.debug("Einspeisung \xDCberschuss: " + einspeisung);
        this.setStateWithAck(import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, einspeisung);
        const bezugNetz = bezugWpRaw;
        this.adapter.log.debug("Bezug Netz: " + bezugNetz);
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
