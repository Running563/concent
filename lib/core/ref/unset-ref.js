"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports["default"] = _default;

var _ccContext = _interopRequireDefault(require("../../cc-context"));

var _setRef = require("./set-ref");

var _util = require("../../support/util");

var ccUKey_ref_ = _ccContext["default"].ccUKey_ref_,
    ccUKey_handlerKeys_ = _ccContext["default"].ccUKey_handlerKeys_,
    runtimeVar = _ccContext["default"].runtimeVar,
    ccClassKey_ccClassContext_ = _ccContext["default"].ccClassKey_ccClassContext_,
    handlerKey_handler_ = _ccContext["default"].handlerKey_handler_;

function _default(ccClassKey, ccUniqueKey) {
  if (runtimeVar.isDebug) {
    console.log((0, _util.styleStr)(ccUniqueKey + " unset ref"), (0, _util.color)('purple'));
  }

  delete ccUKey_ref_[ccUniqueKey];
  var classContext = ccClassKey_ccClassContext_[ccClassKey];
  var ccKeys = classContext.ccKeys;
  var ccKeyIdx = ccKeys.indexOf(ccUniqueKey);
  if (ccKeyIdx >= 0) ccKeys.splice(ccKeyIdx, 1);
  (0, _setRef.decCcKeyInsCount)(ccUniqueKey);
  var handlerKeys = ccUKey_handlerKeys_[ccUniqueKey];

  if (handlerKeys) {
    handlerKeys.forEach(function (hKey) {
      delete handlerKey_handler_[hKey];
    });
  }
}