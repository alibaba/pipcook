#pragma once

#include "common.h"
#include "object.h"
#include <napi.h>
#include <pybind11/embed.h>

using namespace std;
using namespace Napi;

namespace boa {

class PythonReference {
public:
  PythonReference(PythonObject *scope);

  template <typename T = PythonReference> static T *Unwrap(PyObject *wrapped);
  static PyObject *Finalize(PyObject *self, PyObject *args_in,
                            PyObject *kwargs_in);
  void addFinalizer();
  void assignTarget(PyObject *);
  PyObject *target();
  PythonObject *scope();

protected:
  /**
   * the object that reference to.
   */
  PythonObject *mScope;
  /**
   * capsule object for passing reference object.
   */
  PyObject *mCapsule;

private:
  /**
   * pointer to the reference object.
   */
  PyObject *mTarget = nullptr;
  /**
   * weakref & callback
   */
  PyObject *mWeakref;
  PyObject *mFinalizer;
  PyMethodDef mFinalizerDef;
};

} // namespace boa
