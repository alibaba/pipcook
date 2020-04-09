#pragma once

#include "common.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace Napi;

namespace boa {

class PythonModule : public ObjectWrap<PythonModule> {
public:
  static Object Init(Napi::Env env, Object exports);
  PythonModule(const CallbackInfo &info);

private:
  static Napi::FunctionReference constructor;
  Napi::Value Reload(const CallbackInfo &info);
  Napi::Value Define(const CallbackInfo &info);

private:
  pybind::module _module;
};

} // namespace boa
