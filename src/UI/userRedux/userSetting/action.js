/*
 * @Author: maxiangan
 * @Date: 2023-10-16 09:15:20
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-10-17 16:15:24
 * @Description: 请填写简介
 */
import * as actionType from "./actionType";

export function changeToolbarState(name, enable) {
  return {
    type: actionType.CHANGE_TOOLBAR_STATE,
    name,
    enable,
  };
}

export function setToolbarState(toolState) {
  return {
    type: actionType.SET_TOOLBAR_STATE,
    toolState,
  };
}

export function setCustomToolbarState(toolState) {
  return {
    type: actionType.SET_CUSTOMTOOLSTATE,
    customToolState: toolState,
  };
}

export function changeDisplaySetting(name, value) {
  window.localStorage.setItem(`${name}`, value);
  return {
    type: actionType.CHANGE_DISPLAY_SETTING,
    name,
    value,
  };
}

export function changeCameraSetting(name, value) {
  return {
    type: actionType.CHANGE_CAMERA_SETTING,
    name,
    value,
  };
}

export function restoreSetting(settingType) {
  return {
    type: actionType.RESTORE_SETTING,
    settingType,
  };
}

export function changeModelSetting(modelKey, name, value) {
  return {
    type: actionType.CHANGE_MODEL_SETTING,
    modelKey,
    name,
    value,
  };
}

export function setSetting(setting) {
  return {
    type: actionType.SET_SETTING,
    setting,
  };
}

export function changeBestView(visible = false) {
  return {
    type: actionType.CHANGE_BEST_VIEW,
    visible,
  };
}

export function changeBaking(visible = false) {
  return {
    type: actionType.CHANGE_BAKING,
    visible,
  };
}
