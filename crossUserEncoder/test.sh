#!/usr/bin/env bash

rm output.mp4
dist/bin/ffmpeg -i input.wav -b:a 32k output.mp4