#include "core/module.h"
#include "core/node.h"
#include "core/object.h"
#include <dlfcn.h>
#include <napi.h>

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Preload the Python library for resolving numpy tracky issue.
#if defined(__APPLE__) || defined(__MACH__)
  dlopen("libpython3.7m.dylib", RTLD_LAZY | RTLD_GLOBAL);
#elif defined(__linux__) || defined(__unix__)
  dlopen("libpython3.7m.so", RTLD_LAZY | RTLD_GLOBAL);
#endif

  boa::PythonNode::Init(env, exports);
  boa::PythonModule::Init(env, exports);
  boa::PythonObject::Init(env, exports);
  return exports;
}

NODE_API_MODULE(boa, Init)
