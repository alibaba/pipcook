#!/bin/sh

rm -f ./Miniconda3*.sh
if [ -f ".CONDA_INSTALL_DIR" ]; then
  rm -rf `cat .CONDA_INSTALL_DIR`
  rm -f .CONDA_INSTALL_DIR
fi
