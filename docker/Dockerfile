FROM nvidia/cuda:10.1-cudnn7-devel
ARG VER=latest

LABEL version=${VER}
LABEL description="docker image for pipcook runtime"

ENV TF_FORCE_GPU_ALLOW_GROWTH=true

WORKDIR /root/
RUN apt-get update && apt-get install -y curl wget python git libglib2.0-0 libsm6 libxrender-dev

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

RUN npm install @pipcook/pipcook-cli@${VER} -g && pipcook init ${VER}
