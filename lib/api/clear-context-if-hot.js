"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports["default"] = _default;

var _util = require("../support/util");

var _ccContext = _interopRequireDefault(require("../cc-context"));

var _pickDepFns = require("../core/base/pick-dep-fns");

var _constant = require("../support/constant");

var _initModuleComputed = _interopRequireDefault(require("../core/computed/init-module-computed"));

var _findDepFnsToExecute = require("../core/base/find-dep-fns-to-execute");

var _initModuleWatch = _interopRequireDefault(require("../core/watch/init-module-watch"));

var _createDispatcher = _interopRequireDefault(require("./create-dispatcher"));

var _appendDispatcher = _interopRequireDefault(require("../core/base/append-dispatcher"));

var justCalledByStartUp = false;
/**
  CodeSandbox ide里，当runConcent.js单独放置时，代码结构如下
    import React, { Component } from "react";
    import ReactDom from "react-dom";
    import "./runConcent";
    import App from "./App";
    import { clearContextIfHot } from "concent";

    clearContextIfHot();
    ReactDom.render(<App />, document.getElementById("root"));
 * 
 * 如果只修改了其他地方的代码属于App相关依赖的代码，查看dom结构返现热加载直接将dispatcher div标签丢弃，
 * 同时refs里也没有dispatcher引用了，这里做一次额外检查
 */

function _checkDispatcher() {
  if (!_ccContext["default"].refs[_constant.CC_DISPATCHER]) {
    var Dispatcher = (0, _createDispatcher["default"])();
    (0, _appendDispatcher["default"])(Dispatcher);
  }
}

function _clearInsAssociation(recomputed, otherExcludeKeys) {
  if (recomputed === void 0) {
    recomputed = false;
  }

  (0, _findDepFnsToExecute.clearCuRefer)();
  (0, _util.clearObject)(_ccContext["default"].event_handlers_);
  (0, _util.clearObject)(_ccContext["default"].ccUKey_handlerKeys_);
  var cct = _ccContext["default"].ccClassKey_ccClassContext_;
  var ccUKey_ref_ = _ccContext["default"].ccUKey_ref_;
  Object.keys(cct).forEach(function (ccClassKey) {
    var ctx = cct[ccClassKey];
    var ccKeys = ctx.ccKeys;
    var tmpExclude = [];

    if (otherExcludeKeys.length > 0) {
      ccKeys.forEach(function (ccKey) {
        if (otherExcludeKeys.includes(ccKey)) {
          tmpExclude.push(ccKey);
        }
      });
    }

    (0, _util.clearObject)(ctx.ccKeys, tmpExclude);
  });
  (0, _util.clearObject)(_ccContext["default"].handlerKey_handler_);
  (0, _util.clearObject)(ccUKey_ref_, [_constant.CC_DISPATCHER].concat(otherExcludeKeys));

  if (recomputed) {
    var computed = _ccContext["default"].computed,
        watch = _ccContext["default"].watch;
    var computedValue = computed._computedValue;
    var watchDep = watch._watchDep;
    var modules = (0, _util.okeys)(_ccContext["default"].store._state);
    modules.forEach(function (m) {
      if (m === _constant.MODULE_CC) return;

      if (computedValue[m]) {
        // !!!先清除之前建立好的依赖关系
        _ccContext["default"].computed._computedDep[m] = (0, _util.makeCuDepDesc)();
        (0, _initModuleComputed["default"])(m, computed._computedRaw[m]);
      }

      if (watchDep[m]) {
        // !!!先清除之前建立好的依赖关系
        watchDep[m] = (0, _util.makeCuDepDesc)();
        (0, _initModuleWatch["default"])(m, watch._watchRaw[m]);
      }
    });
  }
} // 这些CcFragIns随后需要被恢复


function _pickCcFragIns() {
  var ccUKey_ref_ = _ccContext["default"].ccUKey_ref_;
  var ccFragKeys = [];
  (0, _util.okeys)(ccUKey_ref_).forEach(function (ccKey) {
    var ref = ccUKey_ref_[ccKey];

    if (ref && ref.ctx.type === _constant.CC_FRAGMENT && ref.props.__$$regDumb !== true // 直接<CcFragment>实例化的
    && ref.__$$isMounted === true // 已挂载
    && ref.__$$isUnmounted == false // 未卸载
    ) {
        ccFragKeys.push(ccKey);
      }
  });
  return ccFragKeys;
}

function _clearAll() {
  (0, _util.clearObject)(_ccContext["default"].globalStateKeys); // 在codesandbox里，按标准模式组织的代码，如果只是修改了runConcent里相关联的代码，pages目录下的configure调用不会被再次触发的
  // 所以是来自configure调用配置的模块则不参与清理，防止报错

  var toExcludedModules = (0, _util.okeys)(_ccContext["default"].moduleName_isConfigured_).concat([_constant.MODULE_DEFAULT, _constant.MODULE_CC, _constant.MODULE_GLOBAL, _constant.MODULE_CC_ROUTER]);
  (0, _util.clearObject)(_ccContext["default"].reducer._reducer, toExcludedModules);
  (0, _util.clearObject)(_ccContext["default"].store._state, toExcludedModules, {});
  (0, _util.clearObject)(_ccContext["default"].computed._computedDep, toExcludedModules);
  (0, _util.clearObject)(_ccContext["default"].computed._computedValue, toExcludedModules);
  (0, _util.clearObject)(_ccContext["default"].watch._watchDep, toExcludedModules);
  (0, _util.clearObject)(_ccContext["default"].middlewares);
  (0, _util.clearObject)(_ccContext["default"].waKey_uKeyMap_);
  (0, _pickDepFns.clearCachedData)();

  var ccFragKeys = _pickCcFragIns();

  _clearInsAssociation(false, ccFragKeys);

  return ccFragKeys;
}

function _default(clearAll) {
  if (clearAll === void 0) {
    clearAll = false;
  }

  _ccContext["default"].info.latestStartupTime = Date.now();
  var ccFragKeys = [];

  if (_ccContext["default"].isStartup) {
    if (_ccContext["default"].isHotReloadMode()) {
      if (clearAll) {
        console.warn("attention: make sure [[clearContextIfHot]] been called before app rendered!");
        justCalledByStartUp = true;
        ccFragKeys = _clearAll(clearAll);
        return ccFragKeys;
      } else {
        // 如果刚刚被startup调用，则随后的调用只是把justCalledByStartUp标记为false
        // 因为在stackblitz的 hot reload 模式下，当用户将启动cc的命令单独放置在一个脚本里，
        // 如果用户修改了启动相关文件, 则会触发 runConcent renderApp，
        // runConcent调用清理把justCalledByStartUp置为true，则renderApp这里再次触发clear时就可以不用执行了(注意确保renderApp之前，调用了clearContextIfHot)
        // 而随后只是改了某个component文件时，则只会触发 renderApp，
        // 因为之前已把justCalledByStartUp置为false，则有机会清理实例相关上下文了
        if (justCalledByStartUp) {
          justCalledByStartUp = false;
          return ccFragKeys;
        }

        _checkDispatcher();

        ccFragKeys = _pickCcFragIns(); // !!!重计算各个模块的computed结果

        _clearInsAssociation(_ccContext["default"].reComputed, ccFragKeys);

        return ccFragKeys;
      }
    } else {
      console.warn("clear failed because of not running under hot reload mode!");
      return ccFragKeys;
    }
  } else {
    //还没有启动过，泽只是标记justCalledByStartUp为true
    justCalledByStartUp = true;
    return ccFragKeys;
  }
}