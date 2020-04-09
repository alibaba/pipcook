#pragma once

#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <pybind11/embed.h>

namespace boa {

/**
 * Flags an object as keyword arguments.
 */
#define NODE_PYTHON_KWARGS_NAME "__kwargs__"
/**
 * Flags an object as a Python Bytes object.
 */
#define NODE_PYTHON_BYTES_NAME "__bytes__"
#define NODE_PYTHON_VALUE_NAME "__value__"
#define NODE_PYTHON_HANDLE_NAME "__handle__"
#define NODE_PYTHON_WRAPPED_NAME "__wrapped__"
#define NODE_PYTHON_JS_DISPATCH "__jsdispatch__"

class PythonNode;
class PythonModule;
class PythonReference;
class PythonObject;
class PythonFunction;
class PythonError;

} // namespace boa

namespace pybind = pybind11;
