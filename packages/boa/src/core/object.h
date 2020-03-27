#pragma once

#include "common.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace Napi;

namespace boa {

class PythonObject : public ObjectWrap<PythonObject> {
public:
  static Object Init(Napi::Env env, Object exports);
  static Object NewInstance(Napi::Env env, pybind::object from);
  PythonObject(const CallbackInfo &info);
  pybind::object value();

private:
  static FunctionReference constructor;

  Napi::Value Next(const CallbackInfo &);
  Napi::Value Invoke(const CallbackInfo &);
  Napi::Value InstanceOf(const CallbackInfo &);
  Napi::Value IsCallable(const CallbackInfo &);
  Napi::Value IsIterator(const CallbackInfo &);
  Napi::Value IsMapping(const CallbackInfo &);
  Napi::Value IsSequence(const CallbackInfo &);
  Napi::Value ToBigDecimal(const CallbackInfo &);
  Napi::Value ToBigInt(const CallbackInfo &);
  Napi::Value ToPrimitive(const CallbackInfo &);
  Napi::Value ToString(const CallbackInfo &);
  // Python magic methods
  Napi::Value Hash(const CallbackInfo &);
  Napi::Value HasAttr(const CallbackInfo &);
  Napi::Value GetAttr(const CallbackInfo &);
  Napi::Value GetItem(const CallbackInfo &);
  Napi::Value SetAttr(const CallbackInfo &);
  Napi::Value SetItem(const CallbackInfo &);

public:
  // The followings are to convert Napi value to PyObject*
  inline bool IsKwargs(Napi::Value);
  inline bool IsBytes(Napi::Value);
  inline bool IsPythonObject(Napi::Value);
  std::string ToString();
  PyObject *Cast(Napi::Env, Napi::Value, bool finalizeFuncType = false);
  PyObject *Cast(Napi::Env, String);
  PyObject *Cast(Napi::Env, Boolean);
  PyObject *Cast(Napi::Env, Number);
  PyObject *Cast(Napi::Env env, Function value, bool);
  PyObject *Cast(Napi::Env env, Array value, bool);
  PyObject *Cast(Napi::Env env, Object value, bool);
  void Finalize(Napi::Env);

private:
  pybind::object _self;
  std::vector<PythonFunction *> _funcs;
};

} // namespace boa
