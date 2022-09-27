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
var stateUtils_exports = {};
__export(stateUtils_exports, {
  StateUtils: () => StateUtils
});
module.exports = __toCommonJS(stateUtils_exports);
class StateUtils {
  static createObject(adapter, prefix, state, unit) {
    return adapter.setObjectNotExistsAsync(prefix + state, {
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
  static async setStateWithAck(adapter, state, value) {
    adapter.setStateAsync(state, { val: value, ack: true }).then(() => adapter.log.debug("State has been set"));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StateUtils
});
//# sourceMappingURL=stateUtils.js.map
