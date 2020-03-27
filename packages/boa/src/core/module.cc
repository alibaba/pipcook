#include "module.h"
#include "object.h"

using namespace boa;
using namespace Napi;

FunctionReference PythonModule::constructor;

Object PythonModule::Init(Napi::Env env, Object exports) {
  Napi::HandleScope scope(env);
  Napi::Function func =
      DefineClass(env, "boa.Module",
                  {
                      InstanceMethod("reload", &PythonModule::Reload),
                      InstanceMethod("define", &PythonModule::Define),
                  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Module", func);
  return exports;
}

PythonModule::PythonModule(const CallbackInfo &info)
    : ObjectWrap<PythonModule>(info) {}

Napi::Value PythonModule::Reload(const CallbackInfo &info) {
  return info.Env().Undefined();
}

Napi::Value PythonModule::Define(const CallbackInfo &info) {
  return info.Env().Undefined();
}
