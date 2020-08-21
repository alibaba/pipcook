#pragma once

#include "common.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace Napi;

namespace boa {

class PythonObject : public ObjectWrap<PythonObject>,
                     pybind::detail::generic_type {
public:
  static Object Init(Napi::Env env, Object exports);
  static Object NewInstance(Napi::Env env, pybind::object from);
  PythonObject(const CallbackInfo &info);
  pybind::object value();

private:
  Napi::Value Next(const CallbackInfo &);
  Napi::Value Invoke(const CallbackInfo &);
  Napi::Value CreateClass(const CallbackInfo &);
  Napi::Value InstanceOf(const CallbackInfo &);
  Napi::Value IsCallable(const CallbackInfo &);
  Napi::Value IsIterator(const CallbackInfo &);
  Napi::Value IsMapping(const CallbackInfo &);
  Napi::Value IsSequence(const CallbackInfo &);
  Napi::Value ToBigDecimal(const CallbackInfo &);
  Napi::Value ToBigInt(const CallbackInfo &);
  Napi::Value ToPrimitive(const CallbackInfo &);
  Napi::Value ToString(const CallbackInfo &);
  Napi::Value SetClassMethod(const CallbackInfo &);

  // Python magic methods
  Napi::Value Hash(const CallbackInfo &);
  Napi::Value HasAttr(const CallbackInfo &);
  Napi::Value GetAttr(const CallbackInfo &);
  Napi::Value SetAttr(const CallbackInfo &);
  Napi::Value DelAttr(const CallbackInfo &);
  Napi::Value GetItem(const CallbackInfo &);
  Napi::Value SetItem(const CallbackInfo &);
  Napi::Value DelItem(const CallbackInfo &);

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
  PyObject *Cast(Napi::Env, Function value, bool, bool);
  PyObject *Cast(Napi::Env, Array value, bool);
  PyObject *Cast(Napi::Env, Object value, bool);
  void Finalize(Napi::Env);

private:
  pybind::object _self;
  std::vector<PythonFunction *> _funcs;
};

} // namespace boa
