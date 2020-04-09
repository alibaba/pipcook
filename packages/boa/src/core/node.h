#pragma once

#include "common.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace Napi;

namespace boa {

class PythonNode : public ObjectWrap<PythonNode> {
public:
  static Object Init(Napi::Env, Object);
  PythonNode(const CallbackInfo &);
  ~PythonNode();
  void Finalize(Napi::Env env);

private:
  static Napi::FunctionReference constructor;

  Napi::Value Builtins(const CallbackInfo &);
  Napi::Value Eval(const CallbackInfo &);
  Napi::Value Globals(const CallbackInfo &);
  Napi::Value Import(const CallbackInfo &);
  Napi::Value Print(const CallbackInfo &);

private:
  bool _initialized = false;
};

} // namespace boa
