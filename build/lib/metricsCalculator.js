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
var import_stateUtils = require("./stateUtils");
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
      this.adapter.log.debug("Update EnergyMeterData: " + this.meterData);
      this.meterData = meterData;
      this.calculateMetrics();
      this.calcLive();
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
      this.adapter.log.debug("Wechselrichter Korrekturwert in kWh: " + this.adapter.config.wechselrichterTotalKorrekturWert);
      const wrKWH = parseFloat(this.wechselRichterTotal) / 1e3;
      if (this.adapter.config.wechselrichterTotalKorrekturWert && this.adapter.config.wechselrichterTotalKorrekturWert > 0) {
        import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.wechselrichterCorrected, wrKWH - this.adapter.config.wechselrichterTotalKorrekturWert);
      }
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.wechselrichter, wrKWH);
      const bezugHaushalt = sensorData.strom.bezug;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.bezugHaushalt, bezugHaushalt);
      const einspeisungHaushalt = sensorData.strom.einspeisung;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.einspeisungHaushalt, einspeisungHaushalt);
      const wpBezug = sensorData.heizung["1.8.0"];
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.bezugWp, wpBezug);
      const wpEinspeisung = sensorData.heizung["2.8.0"];
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.einspeisungWp, wpEinspeisung);
      const eigenbedarfHaushalt = wrKWH - einspeisungHaushalt;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfHaushalt, eigenbedarfHaushalt);
      const eigenbedarfWp = wrKWH - wpEinspeisung - eigenbedarfHaushalt;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.eigenbedarfWp, eigenbedarfWp);
      const bezugNetzWp = this.adapter.config.wpEnergyMeterTotalConsumptionBeforeChange + wpBezug - bezugHaushalt;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.bezugNetz, bezugNetzWp);
      const gesamtVerbrauchHaushalt = bezugHaushalt + eigenbedarfHaushalt;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchHaushalt, gesamtVerbrauchHaushalt);
      const gesamtVerbrauchWP = bezugNetzWp + eigenbedarfWp;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.gesamtVerbrauchWp, gesamtVerbrauchWP);
      const eigenbedarfHaushaltAnteil = eigenbedarfHaushalt * 100 / wrKWH;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfHaushalt, eigenbedarfHaushaltAnteil);
      const eigenbedarfWpAnteil = eigenbedarfWp * 100 / wrKWH;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.anteilEigenbedarfWp, eigenbedarfWpAnteil);
      const eigenbedarfGesamtAnteil = (eigenbedarfWp + eigenbedarfHaushalt) * 100 / wrKWH;
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.total.prefix + import_model.STATES.total.gesamtEigenverbrauch, eigenbedarfGesamtAnteil);
      const cumulated = {
        time: new Date().toISOString(),
        wechselrichter: wrKWH,
        bezugHaushalt,
        einspeisungHaushalt,
        bezugWp: wpBezug,
        einspeisungWp: wpEinspeisung,
        eigenbedarfHaushalt,
        eigenbedarfWp,
        bezugNetz: bezugNetzWp,
        gesamtVerbrauchHaushalt,
        gesamtVerbrauchWp: gesamtVerbrauchWP,
        anteilEigenbedarfHaushalt: eigenbedarfHaushaltAnteil,
        anteilEigenbedarfWp: eigenbedarfWpAnteil,
        gesamtEigenverbrauch: eigenbedarfGesamtAnteil
      };
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, "cumulated", JSON.stringify(cumulated));
    }
  }
  calcLive() {
    if (this.wechselRichterCurrent) {
      const sensorData = this.getSensorData();
      const wrCurrent = parseFloat(this.wechselRichterCurrent);
      const haushalt = sensorData.strom.aktleist;
      const wp = sensorData.heizung.aktleist;
      const wechselrichterEinspeisung = wrCurrent < 0 ? 0 : wrCurrent;
      let einspeisung = 0;
      let bezug = 0;
      const haushaltbezugRaw = haushalt;
      const wpBezugRaw = wp;
      let haushaltBezug = 0;
      let wpBezug = 0;
      if (wrCurrent < 0) {
        if (haushalt < 0 || wp < 0) {
          this.adapter.log.warn("wr < 0, haushalt < 0 || wp < 0 should not happen");
          return;
        } else {
          bezug = wp;
          haushaltBezug = haushalt;
          wpBezug = wp - haushalt;
        }
      } else {
        if (haushalt < 0) {
          if (wp < 0) {
            einspeisung = Math.abs(wp);
            haushaltBezug = wrCurrent - Math.abs(haushalt);
            wpBezug = Math.abs(haushalt) - Math.abs(wp);
          } else {
            bezug = wp;
            haushaltBezug = wrCurrent - Math.abs(haushalt);
            wpBezug = Math.abs(haushalt) + wp;
          }
        } else {
          if (wp < 0) {
            this.adapter.log.warn("wr > 0, haushalt > 0 || wp < 0 should not happen");
            return;
          } else {
            bezug = wp;
            haushaltBezug = wrCurrent + haushalt;
            wpBezug = wp - haushalt;
          }
        }
      }
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.wechselrichterEinspeisung, wechselrichterEinspeisung);
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.verbrauchHaushalt, Math.max(haushaltBezug, 0));
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.verbrauchWp, Math.max(wpBezug, 0));
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.bezugNetz, bezug);
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.einspeisungUeberschuss, einspeisung);
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.haushaltBezugRaw, haushaltbezugRaw);
      import_stateUtils.StateUtils.setStateWithAck(this.adapter, import_model.STATES.current.prefix + import_model.STATES.current.wpBezugRaw, wpBezugRaw);
    }
  }
  async initializeStates() {
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.wechselrichterCorrected, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.wechselrichter, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.bezugHaushalt, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.einspeisungHaushalt, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.bezugWp, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.einspeisungWp, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.eigenbedarfHaushalt, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.eigenbedarfWp, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.bezugNetz, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.gesamtVerbrauchHaushalt, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.gesamtVerbrauchWp, "kWh");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.anteilEigenbedarfHaushalt, "%");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.anteilEigenbedarfWp, "%");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.total.prefix, import_model.STATES.total.gesamtEigenverbrauch, "%");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.wechselrichterEinspeisung, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.verbrauchHaushalt, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.verbrauchWp, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.einspeisungUeberschuss, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.bezugNetz, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.haushaltBezugRaw, "W");
    await import_stateUtils.StateUtils.createObject(this.adapter, import_model.STATES.current.prefix, import_model.STATES.current.wpBezugRaw, "W");
    await this.adapter.setObjectNotExistsAsync("cumulated", {
      type: "state",
      common: {
        name: "cumulated",
        type: "object",
        role: "variable",
        read: true,
        write: true
      },
      native: {}
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MetricsCalculator
});
//# sourceMappingURL=metricsCalculator.js.map
