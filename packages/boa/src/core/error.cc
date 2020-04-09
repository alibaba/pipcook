#include "error.h"
#include "object.h"

using namespace boa;
using namespace Napi;

PythonError PythonError::New(napi_env env, pybind::error_already_set e) {
  const char *msg = e.what();
  size_t len = std::strlen(e.what());
  auto jerr = Error::New<PythonError>(env, msg, len, napi_create_error);
  jerr.Set("ptype", PythonObject::NewInstance(env, e.type()));
  jerr.Set("pvalue", PythonObject::NewInstance(env, e.value()));
  jerr.Set("ptrace", PythonObject::NewInstance(env, e.trace()));
  return jerr;
}

inline PythonError::PythonError() : Error() {}

inline PythonError::PythonError(napi_env env, napi_value value)
    : Error(env, value) {}
