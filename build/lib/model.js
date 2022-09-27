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
var model_exports = {};
__export(model_exports, {
  Current: () => Current,
  STATES: () => STATES,
  States: () => States,
  Total: () => Total
});
module.exports = __toCommonJS(model_exports);
class Total {
  constructor() {
    this.prefix = "total.";
    this.wechselrichterCorrected = "wechselrichterCorrected";
    this.wechselrichter = "wechselrichter";
    this.bezugHaushalt = "bezugHaushalt";
    this.einspeisungHaushalt = "einspeisungHaushalt";
    this.bezugWp = "bezugWp";
    this.einspeisungWp = "einspeisungWp";
    this.eigenbedarfHaushalt = "eigenbedarfHaushalt";
    this.eigenbedarfWp = "eigenbedarfWp";
    this.bezugNetz = "bezugNetz";
    this.gesamtVerbrauchHaushalt = "gesamtVerbrauchHaushalt";
    this.gesamtVerbrauchWp = "gesamtVerbrauchWp";
    this.anteilEigenbedarfHaushalt = "anteilEigenbedarfHaushalt";
    this.anteilEigenbedarfWp = "anteilEigenbedarfWp";
    this.gesamtEigenverbrauch = "gesamtEigenverbrauch";
  }
}
class Current {
  constructor() {
    this.prefix = "current.";
    this.wechselrichterEinspeisung = "wechselrichterEinspeisung";
    this.haushaltBezugRaw = "haushaltBezugRaw";
    this.wpBezugRaw = "wpBezugRaw";
    this.verbrauchHaushalt = "verbrauchHaushalt";
    this.verbrauchWp = "verbrauchWp";
    this.einspeisungUeberschuss = "einspeisungUeberschuss";
    this.bezugNetz = "bezugNetz";
  }
}
class States {
  constructor() {
    this.total = new Total();
    this.current = new Current();
  }
}
const STATES = new States();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Current,
  STATES,
  States,
  Total
});
//# sourceMappingURL=model.js.map
