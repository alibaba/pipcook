FROM centos/nodejs-12-centos7:latest
LABEL version=1.1
LABEL description="docker image for pipcook runtime"

COPY --from=nvidia/cuda:10.0-cudnn7-runtime /usr/local/cuda-10.0 /usr/local/cuda-10.0
COPY --from=nvidia/cuda:10.1-cudnn7-runtime /usr/local/cuda-10.1 /usr/local/cuda-10.1

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64:/usr/local/cuda-10.1/lib64:${LD_LIBRARY_PATH}

WORKDIR /opt/pipcook
RUN npm install @pipcook/pipcook-cli -g  && pipcook init
