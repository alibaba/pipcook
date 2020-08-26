FROM centos/nodejs-12-centos7:latest
ARG VER=latest

LABEL version=${VER}
LABEL description="docker image for pipcook runtime"

COPY --from=nvidia/cuda:10.2-cudnn7-runtime /usr/local/cuda-10.2 /usr/local/cuda-10.2
COPY --from=nvidia/cuda:10.1-cudnn7-runtime /usr/local/cuda-10.1 /usr/local/cuda-10.1

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/lib64:/usr/local/cuda-10.2/lib64:${LD_LIBRARY_PATH}

WORKDIR ${HOME}
RUN npm install @pipcook/pipcook-cli@${VER} -g && pipcook init ${VER}
