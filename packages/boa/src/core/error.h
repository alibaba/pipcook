#pragma once

#include "common.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace Napi;

namespace boa {

class PythonError : public Napi::Error {
public:
  static PythonError New(napi_env env, pybind::error_already_set e);

  PythonError();
  PythonError(napi_env env, napi_value value);
};

} // namespace boa
