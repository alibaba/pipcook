{
  "targets": [
    {
      "target_name": "boa",
      "sources": [
        "src/binding.cc",
        "src/core/node.cc",
        "src/core/module.cc",
        "src/core/object.cc",
        "src/core/error.cc",
        "src/core/function.cc",
        "src/core/reference.cc",
      ],
      "cflags!": [
        "-fno-exceptions",
        "-fno-rtti",
      ],
      "cflags_cc!": [
        "-std=c++11",
        "-stdlib=libc++",
        "-fno-exceptions",
        "-fno-rtti",
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "pybind11/include",
      ],
      "libraries": [
        "-lpython3.7",
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS",
        "NAPI_EXPERIMENTAL",
      ],
      "conditions": [
        ['OS=="mac"', {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "GCC_ENABLE_CPP_RTTI": "YES",
          },
          "include_dirs": [
            "<!@(brew --prefix python@3)/Frameworks/Python.framework/Versions/3.7/include/python3.7m",
          ],
          "library_dirs": [
            "<!@(brew --prefix python@3)/Frameworks/Python.framework/Versions/3.7/lib",
          ],
        }],
      ],
    },
  ]
}