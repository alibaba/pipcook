#include "core/module.h"
#include "core/node.h"
#include "core/object.h"
#include <napi.h>

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  boa::PythonNode::Init(env, exports);
  boa::PythonModule::Init(env, exports);
  boa::PythonObject::Init(env, exports);
  return exports;
}

NODE_API_MODULE(boa, Init)
