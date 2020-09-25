FROM node:latest
ARG VER=latest

LABEL version=${VER}
LABEL description="docker image for pipcook runtime"

WORKDIR /root/
RUN npm install @pipcook/pipcook-cli@${VER} -g
RUN pipcook init ${VER} --tuna

COPY --from=nvidia/cuda:10.2-cudnn7-runtime /usr/local/cuda-10.2 /usr/local/cuda-10.2
COPY --from=nvidia/cuda:10.1-cudnn7-runtime /usr/local/cuda-10.1 /usr/local/cuda-10.1
COPY --from=nvidia/cuda:10.1-cudnn7-runtime /usr/lib/x86_64-linux-gnu/libcu* /usr/lib/x86_64-linux-gnu/

ENV TF_FORCE_GPU_ALLOW_GROWTH=true
ENV LD_LIBRARY_PATH=/usr/local/cuda-10.1/compat/:/usr/local/cuda-10.2/compat/:/usr/local/cuda-10.1/lib64:/usr/local/cuda-10.2/lib64:${LD_LIBRARY_PATH}

WORKDIR ${HOME}
RUN npm install @pipcook/pipcook-cli@${VER} -g && pipcook init ${VER}
