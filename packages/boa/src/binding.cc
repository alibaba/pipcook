#include "core/module.h"
#include "core/node.h"
#include "core/object.h"
#include <dlfcn.h>
#include <napi.h>

#define _CONCAT_NX(NAME, POSTFIX) lib ## NAME ## POSTFIX
#define _CONCAT(NAME, POSTFIX) _CONCAT_NX(NAME, POSTFIX)
#define _STRINGIZE_NX(S) #S
#define _STRINGIZE(S) _STRINGIZE_NX(S)

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Preload the Python library for resolving numpy tracky issue.
#if defined(__APPLE__) || defined(__MACH__)
  char const* libpython = _STRINGIZE(_CONCAT(BOA_LIBPYTHON_NAME, .dylib));
#elif defined(__linux__) || defined(__unix__)
  char const* libpython = _STRINGIZE(_CONCAT(BOA_LIBPYTHON_NAME, .so));
#endif
  void* r = dlopen(libpython, RTLD_LAZY | RTLD_GLOBAL);
  if (r == NULL) {
    Error::New(env, "dlopen libpython failed.").ThrowAsJavaScriptException();
    return exports;
  }

  boa::PythonNode::Init(env, exports);
  boa::PythonModule::Init(env, exports);
  boa::PythonObject::Init(env, exports);
  return exports;
}

#undef _CONCAT_NX
#undef _CONCAT
#undef _STRINGIZE_NX
#undef _STRINGIZE

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
