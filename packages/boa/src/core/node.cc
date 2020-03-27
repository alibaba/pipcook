#include "node.h"
#include "object.h"

using namespace boa;
using namespace Napi;

Napi::FunctionReference PythonNode::constructor;

Napi::Object PythonNode::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);
  Napi::Function func =
      DefineClass(env, "Python",
                  {
                      InstanceMethod("builtins", &PythonNode::Builtins),
                      InstanceMethod("eval", &PythonNode::Eval),
                      InstanceMethod("globals", &PythonNode::Globals),
                      InstanceMethod("import", &PythonNode::Import),
                      InstanceMethod("print", &PythonNode::Print),
                  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Python", func);
  return exports;
}

PythonNode::PythonNode(const CallbackInfo &info)
    : Napi::ObjectWrap<PythonNode>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  {
    pybind::initialize_interpreter();
    // Set Python Arguments.
    if (info[0].IsArray()) {
      Napi::Array jargv = info[0].As<Napi::Array>();
      size_t argc = jargv.Length();
      wchar_t *argv[argc];

      for (size_t idx = 0; idx < argc; idx++) {
        Napi::Value v = jargv[idx];
        std::string s = std::string(v.As<String>());
        argv[idx] = Py_DecodeLocale(s.c_str(), nullptr);
      }
      PySys_SetArgvEx(argc, argv, 0);

      for (wchar_t *item : argv)
        PyMem_RawFree(item);
    }
    _initialized = true;
  }
}

PythonNode::~PythonNode() {
  if (_initialized == true) {
    pybind::finalize_interpreter();
    _initialized = false;
  }
}

void PythonNode::Finalize(Napi::Env env) {
  // fprintf(stderr, "boa(Python) is done\n");
}

Napi::Value PythonNode::Builtins(const CallbackInfo &info) {
  PyObject *builtins = PyEval_GetBuiltins();
  if (builtins == NULL) {
    Napi::TypeError::New(info.Env(), "Python builtins is null.")
        .ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  return PythonObject::NewInstance(
      info.Env(), pybind::reinterpret_borrow<pybind::object>(builtins));
}

Napi::Value PythonNode::Eval(const CallbackInfo &info) {
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(info.Env(), "String is excepted.")
        .ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  std::string expr = std::string(info[0].As<String>());
  Object opts = info[1].As<Object>();
  auto globals = PythonObject::Unwrap(opts.Get("globals").As<Object>());
  auto locals = PythonObject::Unwrap(opts.Get("locals").As<Object>());
  auto result = pybind::eval(expr, globals->value(), locals->value());
  return PythonObject::NewInstance(info.Env(), result);
}

Napi::Value PythonNode::Globals(const CallbackInfo &info) {
  return PythonObject::NewInstance(info.Env(), pybind::globals());
}

Napi::Value PythonNode::Import(const CallbackInfo &info) {
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(info.Env(), "String is excepted.")
        .ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  std::string mModulePath = std::string(info[0].As<String>());
  pybind::object obj = pybind::module::import(mModulePath.c_str());
  return PythonObject::NewInstance(info.Env(), obj);
}

Napi::Value PythonNode::Print(const CallbackInfo &info) {
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(info.Env(), "String is expected.")
        .ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  std::string msg = std::string(info[0].As<String>());
  pybind::print(msg);
  return info.Env().Undefined();
}
