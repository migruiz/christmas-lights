#!/bin/bash  
set -ev
HUBNAME=""
if [[ -z "$TRAVIS_TAG" ]]; then
	if [ "$TRAVIS_BRANCH" = "master" ]; then
		HUBNAME=migruiz/$PI_APP-$PI_TYPE;
	else
		HUBNAME=migruiz/$PI_APP-$PI_TYPE:$TRAVIS_BRANCH
	fi   
else
	HUBNAME=migruiz/$PI_APP-$PI_TYPE:$TRAVIS_TAG;
fi
docker pull $HUBNAME || true
docker build -f Dockerfile_$PI_TYPE --cache-from $HUBNAME  -t $HUBNAME  . 
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin 
docker push $HUBNAME  