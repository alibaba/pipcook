#!/usr/bin/env python

# Copyright 2015-present Samsung Electronics Co., Ltd. and other contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import print_function

import argparse
import fileinput
import functools
import os
import subprocess
import tempfile
from distutils import spawn

def parse_option():
    parser = argparse.ArgumentParser()
    parser.add_argument('--autoedit', action='store_true', default=False,
        help='Automatically edit the detected clang format errors.'
        'No diffs will be displayed')

    option = parser.parse_args()
    return option

class Executor(object):
    _TERM_RED = "\033[1;31m"
    _TERM_YELLOW = "\033[1;33m"
    _TERM_GREEN = "\033[1;32m"
    _TERM_BLUE = "\033[1;34m"
    _TERM_EMPTY = "\033[0m"

    @staticmethod
    def cmd_line(cmd, args=[]):
        return ' '.join([cmd] + args)

    @staticmethod
    def print_cmd_line(cmd, args=[]):
        print("%s%s%s" % (Executor._TERM_BLUE, Executor.cmd_line(cmd, args),
                          Executor._TERM_EMPTY))
        print()

    @staticmethod
    def fail(msg):
        print()
        print("%s%s%s" % (Executor._TERM_RED, msg, Executor._TERM_EMPTY))
        print()
        exit(1)

    @staticmethod
    def run_cmd(cmd, args=[], quiet=False, cwd=None):
        if not quiet:
            Executor.print_cmd_line(cmd, args)
        try:
            return subprocess.call([cmd] + args, cwd=cwd, env=environ)
        except OSError as e:
            Executor.fail("[Failed - %s] %s" % (cmd, e.strerror))

    @staticmethod
    def run_cmd_output(cmd, args=[], quiet=False):
        if not quiet:
            Executor.print_cmd_line(cmd, args)
        try:
            return subprocess.check_output([cmd] + args)
        except OSError as e:
            Executor.fail("[Failed - %s] %s" % (cmd, e.strerror))

    @staticmethod
    def check_run_cmd(cmd, args=[], quiet=False, cwd=None):
        retcode = Executor.run_cmd(cmd, args, quiet, cwd)
        if retcode != 0:
            Executor.fail("[Failed - %d] %s" % (retcode,
                                                Executor.cmd_line(cmd, args)))

class ClangFormat(object):

    def __init__(self, extensions, skip_files=None, options=None):
        self.diffs = []
        self._extensions = extensions
        self._skip_files = skip_files
        self._options = options
        self._check_clang_format("clang-format-9.0")

    def _check_clang_format(self, base):
        clang_format = spawn.find_executable(base)

        if not clang_format:
            clang_format = spawn.find_executable("clang-format")
            if clang_format:
                print("%sUsing %s instead of %s%s"
                      % (Executor._TERM_YELLOW, clang_format, base, Executor._TERM_EMPTY))
            else:
                print("%sNo %s found, skipping checks!%s"
                      % (Executor._TERM_RED, base, Executor._TERM_EMPTY))

        self._clang_format = clang_format

    @property
    def error_count(self):
        return len(self.diffs)

    def is_checked_by_clang(self, file):
        _, ext =  os.path.splitext(file)
        return ext in self._extensions and file not in self._skip_files

    def check(self, files):
        if not self._clang_format:
            return

        for file in filter(self.is_checked_by_clang, files):
            args = ['-style=file', file]
            if self._options and self._options.autoedit:
                args.append('-i')
            output = Executor.run_cmd_output(self._clang_format,
                                       args,
                                       quiet=True)

            if output:
                with tempfile.NamedTemporaryFile() as temp:
                    temp.write(output)
                    temp.flush() # just to be really safe
                    self._diff(file, temp.name)

    def _diff(self, original, formatted):
        try:
            subprocess.check_output(['diff', '-u', original, formatted])
        except subprocess.CalledProcessError as error:
            # if there is a difference between the two files
            # this error will be generated and we can extract
            # the diff from that it. Otherwise nothing to do.
            self.diffs.append(error.output.decode())


class FileFilter(object):

    def __init__(self, allowed_exts, allowed_files, skip_files):
        self._allowed_exts = allowed_exts
        self._allowed_files = allowed_files
        self._skip_files = skip_files

    def __call__(self, dir_path, file):
        if file in self._allowed_files:
            return True

        if file in self._skip_files:
            return False

        _, ext =  os.path.splitext(file)
        return ext in self._allowed_exts

def files_under(path, dirs_to_skip=[], file_filter=None):
    def filter_all(dirpath, basename):
        return True

    file_filter = file_filter or filter_all
    files = []
    if os.path.isfile(path):
        if file_filter(dirname(path), os.path.basename(path)):
            files.append(path)
        return files

    if os.path.basename(path) in dirs_to_skip:
        return []

    for (dirpath, dirnames, filenames) in os.walk(path):
        for d in dirs_to_skip:
            if d in dirnames:
                dirnames.remove(d)

        for filename in filenames:
            if file_filter(dirpath, filename):
                files.append(os.path.join(dirpath, filename))
    return files


def check_tidy(src_dir, options=None):
    allowed_exts = ['.c', '.cc', '.cpp', '.h', '.hpp']
    skip_dirs = ['build',
                 '.git', '.data', '.checkpoints', '.nyc_output',
                 'node_modules', 'coverage', 'pybind11',
                 ]
    skip_files = []

    clang = ClangFormat(allowed_exts, [], options)
    file_filter = FileFilter(allowed_exts, [], skip_files)
    files = files_under(src_dir, skip_dirs, file_filter)
    excluded_files = [file_path
                      for file_path in files
                      for skip_file in skip_files
                      if file_path.endswith(skip_file)]
    files = [file_path
             for file_path in files
             if file_path not in excluded_files]

    clang.check(files)
    if clang.error_count:
        print("Detected clang-format problems:")
        print("".join(clang.diffs))
        print()

    msg_color = Executor._TERM_RED if clang.error_count > 0 else Executor._TERM_GREEN
    print("%s* total errors: %d%s" % (msg_color, clang.error_count, Executor._TERM_EMPTY))
    print()
    return clang.error_count == 0

if __name__ == '__main__':
    PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
    options = parse_option()
    no_error = check_tidy(PROJECT_ROOT, options)
    if not no_error:
        exit(1)