#pragma once

#include "common.h"
#include "object.h"
#include "reference.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace std;
using namespace Napi;

namespace boa {

class PythonFunction : public PythonReference {
public:
  PythonFunction(Napi::Env, Napi::Function, PythonObject *);
  static PyObject *Dispatcher(PyObject *self, PyObject *args_in,
                              PyObject *kwargs_in);

private:
  Napi::Env env;
  Napi::FunctionReference jsref;
  /**
   * function object
   */
  PyMethodDef mMethodDef;
};

} // namespace boa
