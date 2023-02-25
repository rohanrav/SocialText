#!/bin/bash

echo What version?
read VERSION

docker build -t r8ravind/lireddit:$VERSION .
docker push r8ravind/lireddit:$VERSION

ssh root@146.190.218.234 "docker pull r8ravind/lireddit:$VERSION && docker tag r8ravind/lireddit:$VERSION dokku/api:$VERSION && dokku deploy api $VERSION"
